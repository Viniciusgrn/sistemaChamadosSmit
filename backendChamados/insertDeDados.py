import csv
from unidade.models import Divisao

with open('Divisao.csv', 'r', encoding='utf-8') as f:
    leitor = csv.DictReader(f)
    registros = [
        Divisao(nome=linha['nome'], sigla=linha['sigla'], secretaria_id=int(linha['secretaria'])) 
        for linha in leitor
    ]
    print(registros) 

    Divisao.objects.bulk_create(registros)


import csv
from unidade.models import Endereco

with open('enderecos.csv', 'r', encoding='utf-8') as f:
    leitor = csv.DictReader(f)
    registros = [
        Endereco( 
            rua = linha['rua'],
            numero = linha['numero'],
            cep = linha['cep'],
            ponto_referencia = linha['ponto_referencia'],
            latitude = float(linha['latitude']) if linha['latitude'].strip() else None,
            longitude = float(linha['longitude']) if linha['longitude'].strip() else None,
            bairro_id = int(linha['bairro']),
        ) 
        for linha in leitor 
    ]
    Endereco.objects.bulk_create(registros)