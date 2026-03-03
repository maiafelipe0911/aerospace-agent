import ctypes
import os

# 1. O Mapa da Memória (Traduzindo a Struct)
class TransferResult(ctypes.Structure):
    _fields_ = [
        ("delta_v1", ctypes.c_double),
        ("delta_v2", ctypes.c_double),
        ("total_delta_v", ctypes.c_double),
        ("time_of_flight", ctypes.c_double)
    ]

# 2. Carregando o Motor
caminho_lib = os.path.abspath("orbital.dll") 
orbital_lib = ctypes.CDLL(caminho_lib)

# 3. Configurando a Porta de Entrada
calcular_hohmann = orbital_lib.calculate_hohmann
calcular_hohmann.argtypes = [ctypes.c_double, ctypes.c_double]
calcular_hohmann.restype = TransferResult

# --- TESTE DE FOGO ---
if __name__ == "__main__":
    alt_origem = 400.0   # LEO
    alt_destino = 35786.0 # GEO
    
    print(f"Acionando motor C++ via Python...")
    
    resultado = calcular_hohmann(alt_origem, alt_destino)
    
    print("\n--- Relatório Recebido no Python ---")
    print(f"Delta V Total: {resultado.total_delta_v:.5f} km/s")
    print(f"Tempo de Voo:  {resultado.time_of_flight:.5f} horas")