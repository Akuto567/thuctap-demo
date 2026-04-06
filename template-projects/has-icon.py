import os

cwd = os.getcwd()

for folder in os.listdir(cwd):
    folder_path = os.path.join(cwd, folder)
    if os.path.isdir(folder_path):
        target_file = os.path.join(folder_path, "public", "assets", "images", "icons", "16x16.png")
        if os.path.isfile(target_file):
            print(f"Found in: {folder}")
        else:
            print(f"Not found in: {folder}")
