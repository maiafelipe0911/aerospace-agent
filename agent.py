import ollama

# 1. O Manual de Instruções da Ferramenta 
ferramenta_altitudes = {
  'type': 'function',
  'function': {
    'name': 'extrair_altitudes',
    'description': 'Extrai a altitude de origem e a altitude de destino em km.',
    'parameters': {
      'type': 'object',
      'properties': {
        'origem_km': {
          'type': 'number',
          'description': 'A altitude atual do satelite em km',
        },
        'destino_km': {
          'type': 'number',
          'description': 'A altitude para a qual o satelite deve go em km',
        },
      },
      'required': ['origem_km', 'destino_km'],
    },
  },
}

mensagem_usuario = "Fala controle da missão, preciso calcular o combustível pra levar um satélite que tá a 400km de altura para a órbita geoestacionária que fica a 35786km."
print(f"Usuário: {mensagem_usuario}")
print("IA Local Pensando...\n")

# 2. Chamando o Cérebro Local
# O Llama 3.1 vai processar isso usando o seu próprio hardware!
resposta = ollama.chat(
    model='llama3.1', 
    messages=[{'role': 'user', 'content': mensagem_usuario}],
    tools=[ferramenta_altitudes]
)

# 3. Lendo o Resultado
if resposta.get('message', {}).get('tool_calls'):
    for chamada in resposta['message']['tool_calls']:
        print(f"Sucesso! IA Local acionou a ferramenta: {chamada['function']['name']}")
        print("Parâmetros extraídos:")
        for parametro, valor in chamada['function']['arguments'].items():
            print(f" -> {parametro}: {valor}")
else:
    print("A IA Local apenas respondeu em texto (ou não usou a ferramenta):")
    print(resposta['message']['content'])