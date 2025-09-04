from tensorflow.keras.models import load_model
import torch
from torch import nn
from ultralytics import YOLO
class ModelLoader:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        
    def get_models(self):
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model1 = YOLO("best.pt").to(device)
        self.model1.eval()  # Set to evaluation mode
        
        
        self.model2 = load_model("categorization.h5")
        return self.model1, self.model2