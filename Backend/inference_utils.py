from PIL import Image
import numpy as np
from tensorflow.keras.preprocessing import image
import io

def preprocess_image(file, target_size=(227, 227)):
    img = Image.open(file).convert('L').resize(target_size)
    img_array = image.img_to_array(img)
    return np.expand_dims(img_array, axis=0)
