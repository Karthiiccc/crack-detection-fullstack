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

The AI model files are not included in this repository due to their large size. Download them from Google Drive and place them in the `Backend/` directory:

### Required Model Files:
- **`best.pt`** - YOLO detection model (~50MB)  
  [📥 Download best.pt](https://drive.google.com/file/d/1etz_qNtXJVFnJ3S6QvX2A_4EKk6WMnxH/view?usp=drive_link)

- **`categorization.h5`** - CNN classification model (~15MB)  
  [📥 Download categorization.h5](https://drive.google.com/file/d/17CsWNvWGAGNMCpBwD5V3zZmahzdBF9pw/view?usp=drive_link)

- **`Classification.keras`** - Backup classification model (~15MB)  
  [📥 Download Classification.keras](https://drive.google.com/file/d/14kdQqhU0lrA-qckTkVHfA2w1zTWyAdp8/view?usp=drive_link)

### Installation Instructions:
1. Click each download link above to get the model files
2. Place all three files directly in the `Backend/` directory  
3. Verify file names match exactly: `best.pt`, `categorization.h5`, `Classification.keras`

> **Important**: All three model files are required for the application to work properly.

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
- **Model files**: Ensure `best.pt`, `categorization.h5`, and `Classification.keras` exist in Backend folder

### Requirements
- Model files must be downloaded separately from Google Drive links above
- Minimum 4GB RAM recommended
- Internet connection for initial setup
## License

MIT License - see LICENSE file for details.
