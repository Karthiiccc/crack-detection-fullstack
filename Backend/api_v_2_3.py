from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from PIL import Image
import numpy as np
from tensorflow.keras.preprocessing import image
import cv2
from io import BytesIO
import io
from model_loader import ModelLoader
import base64
import uuid
import os
import requests
import zipfile
import shutil
import tempfile
from report_service import ReportService
from datetime import datetime



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ADD React dev server URL here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


crack_detection, orientation_model = ModelLoader().get_models()

# Initialize report service
report_service = ReportService()

orientation_labels = {
    0: "Horizontal Crack",
    1: "Vertical Crack",
    2: "Unprecidented Crack"
}

# Pydantic models for request bodies
class ReportRequest(BaseModel):
    crack_type: str
    confidence: float = 0.0
    image_base64: str = None

def pil_to_base64(pil_img):
    buffered = BytesIO()
    pil_img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return f"data:image/png;base64,{img_str}"


def draw_yolo_boxes(image_np, yolo_results):
    for det in yolo_results[0].boxes.data.cpu().numpy():
        x1, y1, x2, y2, conf, cls = map(int, det[:6])
        cv2.rectangle(image_np, (x1, y1), (x2, y2), (0, 255, 0), 2)
    img_pil = Image.fromarray(cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB))
    return pil_to_base64(img_pil)

def preprocess_image(file, target_size=(227, 227)):
    img = Image.open(file).convert('L').resize(target_size)
    img_array = image.img_to_array(img)
    return np.expand_dims(img_array, axis=0)


def draw_each_bounding_box_separately(original_img_pil, boxes, colors):
    img_list = []
    original_np = cv2.cvtColor(np.array(original_img_pil), cv2.COLOR_RGB2BGR)

    for (x, y, w, h), color in zip(boxes, colors):
        img_copy = original_np.copy()
        cv2.rectangle(img_copy, (x, y), (x + w, y + h), color, 2)
        img_result = Image.fromarray(cv2.cvtColor(img_copy, cv2.COLOR_BGR2RGB))
        img_list.append(img_result)

    return img_list

def iou(box1, box2):
    """Calculate Intersection over Union for two bounding boxes."""
    x1, y1, w1, h1 = box1
    x2, y2, w2, h2 = box2

    # Convert to (x1, y1, x2, y2)
    box1 = [x1, y1, x1 + w1, y1 + h1]
    box2 = [x2, y2, x2 + w2, y2 + h2]

    xi1 = max(box1[0], box2[0])
    yi1 = max(box1[1], box2[1])
    xi2 = min(box1[2], box2[2])
    yi2 = min(box1[3], box2[3])
    inter_area = max(0, xi2 - xi1) * max(0, yi2 - yi1)

    box1_area = (box1[2] - box1[0]) * (box1[3] - box1[1])
    box2_area = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union_area = box1_area + box2_area - inter_area

    return inter_area / union_area if union_area != 0 else 0

def are_different_cracks(prev_boxes, curr_boxes, iou_thresh=0.5):
    """Returns True if current cracks are different from previous cracks."""
    if not prev_boxes and curr_boxes:
        return True
    for cb in curr_boxes:
        if all(iou(cb, pb) < iou_thresh for pb in prev_boxes):
            return True
    return False

def draw_yolo_boxes_separately(image_np, yolo_results):
    COLORS = [
        (255, 0, 0), (0, 255, 0), (0, 0, 255),
        (255, 255, 0), (255, 0, 255), (0, 255, 255),
        (128, 0, 128), (0, 128, 128), (128, 128, 0), (0, 0, 0),
    ]

    detections = yolo_results[0].boxes.data.cpu().numpy()

    boxes = []
    colors = []

    full_img_np = image_np.copy()
    for i, det in enumerate(detections):
        x1, y1, x2, y2, conf, cls = map(int, det[:6])
        color = COLORS[i % len(COLORS)]
        boxes.append((x1, y1, x2 - x1, y2 - y1))  # (x, y, w, h)
        colors.append(color)
        cv2.rectangle(full_img_np, (x1, y1), (x2, y2), color, 2)
        cv2.putText(full_img_np, f"Crack {i+1}", (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

    # Convert full image to base64
    full_img_pil = Image.fromarray(cv2.cvtColor(full_img_np, cv2.COLOR_BGR2RGB))
    full_img_b64 = pil_to_base64(full_img_pil)

    # Generate individual images with only one bounding box each
    original_pil = Image.fromarray(cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB))
    single_box_pil_images = draw_each_bounding_box_separately(original_pil, boxes, colors)

    individual_bboxes_b64 = []
    for img in single_box_pil_images:
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        b64 = base64.b64encode(buffered.getvalue()).decode()
        individual_bboxes_b64.append(f"data:image/png;base64,{b64}")

    return full_img_b64, individual_bboxes_b64


def preprocess_image_from_pil(pil_img, target_size=(227, 227)):
    """Preprocess image from PIL Image object"""
    img = pil_img.convert('L').resize(target_size)
    img_array = image.img_to_array(img)
    return np.expand_dims(img_array, axis=0)

def image_to_base64(image_path):
    with open(image_path, "rb") as img_file:
        img_data = img_file.read()
    img_base64 = base64.b64encode(img_data).decode("utf-8")
    return img_base64

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    contents = await file.read()
    np_img = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
    if frame is None:
        raise HTTPException(status_code=400, detail="Invalid image format")

    yolo_results = crack_detection(frame)
    cracked = len(yolo_results[0].boxes) > 0

    if cracked:
        pil_img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        img_array = preprocess_image_from_pil(pil_img)
        pred = orientation_model.predict(img_array)
        label = orientation_labels.get(np.argmax(pred), "Unknown")
        confidence = float(np.max(pred))  # Get the highest confidence score
        full_img_b64, separate_bboxes_b64 = draw_yolo_boxes_separately(frame, yolo_results)
        return {
            "cracked": True,
            "orientation": label,
            "confidence": confidence,
            "annotated_image": full_img_b64,
            "individual_bboxes": separate_bboxes_b64
        }
    else:
        return {"cracked": False, "orientation": None, "confidence": 0.0, "annotated_image": None, "individual_bboxes": []}


@app.post("/zip_upload")
async def zip_upload(file: UploadFile = File(...)):
    if not file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="File must be a zip archive")
    
    try:
        temp_dir = f"temp_{uuid.uuid4()}"
        os.makedirs(temp_dir, exist_ok=True)
        zip_path = os.path.join(temp_dir, "upload.zip")

        with open(zip_path, "wb") as f:
            f.write(await file.read())

        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(temp_dir)
            extracted_files = zip_ref.namelist()

        results = []

        for filename in extracted_files:
            if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                img_path = os.path.join(temp_dir, filename)
                frame = cv2.imread(img_path)
                if frame is None:
                    continue

                input_b64 = image_to_base64(img_path)
                yolo_results = crack_detection(frame)
                cracked = len(yolo_results[0].boxes) > 0

                result = {
                    "input_image": f"data:image/png;base64,{input_b64}",
                    "cracked": cracked,
                    "orientation": None,
                    "annotated_image": None,
                    "separate_bounding_box_images": []
                }

                if cracked:
                    pil_img = Image.open(img_path).convert("RGB")
                    img_array = preprocess_image_from_pil(pil_img)
                    pred = orientation_model.predict(img_array)
                    label = orientation_labels.get(np.argmax(pred), "Unknown")
                    full_img_b64, separate_bboxes_b64 = draw_yolo_boxes_separately(frame, yolo_results)

                    result["orientation"] = label
                    result["annotated_image"] = full_img_b64
                    result["separate_bounding_box_images"] = separate_bboxes_b64

                results.append(result)


        shutil.rmtree(temp_dir)
        return JSONResponse(content=results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@app.post("/video")
async def video(file: UploadFile = File(...)):
    if not file.filename.endswith(('.mp4', '.avi', '.mov')):
        raise HTTPException(status_code=400, detail="File must be a video format (.mp4, .avi, .mov)")

    try:
        report_data = await process_video(file)
        return JSONResponse(content=report_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def process_video(video_file):
    report_data = []
    video_bytes = await video_file.read()

    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp:
        temp.write(video_bytes)
        temp_path = temp.name

    cap = cv2.VideoCapture(temp_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_num = 0
    prev_crack_boxes = []

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame_num += 1
        timestamp = frame_num / fps

        yolo_results = crack_detection(frame)
        current_crack_boxes = [
                    box.xyxy[0].tolist()  # or box.xywh[0].tolist() if you're using xywh
                    for box in yolo_results[0].boxes
                ]

        if current_crack_boxes and are_different_cracks(prev_crack_boxes, current_crack_boxes):
            pil_img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            img_array = preprocess_image_from_pil(pil_img)
            pred = orientation_model.predict(img_array)
            label = orientation_labels.get(np.argmax(pred), "Unknown")
            full_img_b64, separate_bboxes_b64 = draw_yolo_boxes_separately(frame, yolo_results)

            report_data.append({
                "Frame #": frame_num,
                "Timestamp (s)": round(timestamp, 2),
                "Crack Status": "Cracked",
                "Classification": label,
                "Full Annotated Image": f'<a href="{full_img_b64}" target="_blank"><img src="{full_img_b64}" width="100"/></a>',
                "Separate Bounding Boxes": [
                    f'<a href="{b}" target="_blank"><img src="{b}" width="100"/></a>'
                    for b in separate_bboxes_b64
                ]
            })

            prev_crack_boxes = current_crack_boxes
    cap.release()
    os.remove(temp_path)
    return report_data


@app.post("/generate-report")
async def generate_report(request: ReportRequest):
    """Generate PDF report for crack detection results"""
    try:
        print(f"Received request: crack_type={request.crack_type}, confidence={request.confidence}")
        print(f"Image base64 length: {len(request.image_base64) if request.image_base64 else 'None'}")
        
        detection_result = {
            'crack_type': request.crack_type,
            'confidence': request.confidence
        }
        
        # Generate PDF report
        print("Calling report_service.generate_report...")
        pdf_buffer = report_service.generate_report(detection_result, request.image_base64)
        print(f"PDF generated successfully, size: {len(pdf_buffer.getvalue())} bytes")
        
        # Create filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"crack_analysis_report_{request.crack_type.replace(' ', '_')}_{timestamp}.pdf"
        
        # Return PDF as streaming response
        return StreamingResponse(
            io.BytesIO(pdf_buffer.getvalue()),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    except Exception as e:
        print(f"ERROR in generate_report: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")


@app.post("/report-preview")
async def report_preview(crack_type: str = Query(..., description="Type of crack detected")):
    """Get preview information for the crack type"""
    try:
        preview_data = report_service.get_crack_preview(crack_type)
        return JSONResponse(content=preview_data)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting preview: {str(e)}")


@app.post("/generate-batch-report")
async def generate_batch_report(request: dict):
    """Generate PDF report for batch (ZIP) processing results"""
    try:
        print(f"Received batch report request with {len(request.get('results', []))} results")
        
        # Generate PDF report for batch processing
        pdf_buffer = report_service.generate_batch_report(request.get('results', []))
        
        # Create filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"crack_batch_analysis_report_{timestamp}.pdf"
        
        # Return PDF as streaming response
        return StreamingResponse(
            io.BytesIO(pdf_buffer.getvalue()),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    except Exception as e:
        print(f"ERROR in generate_batch_report: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating batch report: {str(e)}")


@app.post("/generate-video-report")
async def generate_video_report(request: dict):
    """Generate PDF report for video processing results"""
    try:
        print(f"Received video report request with {len(request.get('results', []))} results")
        
        # Generate PDF report for video processing
        pdf_buffer = report_service.generate_video_report(request.get('results', []))
        
        # Create filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"crack_video_analysis_report_{timestamp}.pdf"
        
        # Return PDF as streaming response
        return StreamingResponse(
            io.BytesIO(pdf_buffer.getvalue()),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    except Exception as e:
        print(f"ERROR in generate_video_report: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating video report: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


