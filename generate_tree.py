import os

# Folder yang mau DIABAIKAN (Silakan tambah sendiri kalau kurang)
# GANTI BARIS KE-4 DENGAN INI:
IGNORE_DIRS = {
    '.git', 'node_modules', '.venv', 'venv', 'env', 
    '__pycache__', '.vscode', 'dist', 'build', 
    'Lib', 'Scripts', 'Include', 'site-packages'
}

def print_tree(startpath, prefix=""):
    # Ambil list isi folder
    try:
        entries = os.listdir(startpath)
    except PermissionError:
        return

    # Urutkan biar rapi (Folder dulu, baru file)
    entries.sort()
    
    # Filter folder yang masuk daftar IGNORE
    entries = [e for e in entries if e not in IGNORE_DIRS]

    for index, entry in enumerate(entries):
        path = os.path.join(startpath, entry)
        is_last = (index == len(entries) - 1)
        
        # Simbol cabang pohon
        connector = "└── " if is_last else "├── "
        
        print(prefix + connector + entry)

        if os.path.isdir(path):
            # Kalau folder, masuk lebih dalam (rekursif)
            extension = "    " if is_last else "│   "
            print_tree(path, prefix + extension)

if __name__ == "__main__":
    print("📂 Struktur Project (Bersih):\n")
    # Mulai dari folder tempat script ini berada (titik .)
    print_tree(".")