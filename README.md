# Crack Detection System

A full-stack application for detecting structural cracks using AI models and generating professional reports.

## Features

- AI-powered crack detection using YOLO and CNN models
- Support for single images, ZIP files, and videos
- Crack orientation classification (Horizontal/Vertical/Unprecedented)
- PDF report generation with expert recommendations
- Interactive web interface with detailed results

## Project Structure

```
Crack_detection_Project3/
├── Backend/                  # Python FastAPI backend
│   ├── api_v_2_3.py         # Main API
│   ├── model_loader.py      # AI models
│   ├── report_service.py    # PDF generation
│   └── requirements.txt     # Dependencies
├── crack-detection-frontend/ # React frontend
│   ├── src/                 # Source code
│   └── package.json         # Dependencies
└── requirements.txt         # Python dependencies
```

## Prerequisites

- Python 3.8+
- Node.js 16+
- Git

## Model Files

The AI model files are not included in this repository due to their large size. You'll need to download them separately:

- `best.pt` - YOLO detection model (~50MB)
- `categorization.h5` - CNN classification model (~15MB)  
- `Classification.keras` - Backup classification model (~15MB)

**Download Link**: [Model Files - Google Drive](https://drive.google.com/your-link-here)

Place these files in the `Backend/` directory before running the application.

## Setup

### 1. Clone Repository
```bash
git clone https://github.com/Karthiiccc/crack-detection-fullstack.git
cd crack-detection-fullstack
```

### 2. Backend Setup
```bash
cd Backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
python -m uvicorn api_v_2_3:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup
```bash
cd crack-detection-frontend
npm install
npm start
```

### 4. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## Usage

1. Open http://localhost:3000 in your browser
2. Choose upload type: Single Image, ZIP File, or Video
3. Upload your file and click "Analyze"
4. View results and generate PDF reports

## API Endpoints

- `POST /predict` - Single image analysis
- `POST /zip_upload` - Batch processing
- `POST /video` - Video analysis
- `POST /generate-report` - PDF generation

## Docker (Optional)

```bash
# Build and start all services
docker-compose up --build

# Access:
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

## Troubleshooting

### Common Issues
- **Module not found**: Ensure virtual environment is activated and dependencies installed
- **Port in use**: Change backend port with `--port 8001`
- **CORS errors**: Verify backend runs on http://localhost:8000
- **Model files**: Ensure `best.pt` and `categorization.h5` exist in Backend folder

### Requirements
- Model files: `best.pt`, `categorization.h5`, `Classification.keras` (not included in repo due to size)
- Minimum 4GB RAM recommended
- Internet connection for initial setup

> **Note**: The AI model files are excluded from the repository due to their large size. You'll need to obtain these files separately and place them in the `Backend/` directory before running the application.

## License

MIT License - see LICENSE file for details.
