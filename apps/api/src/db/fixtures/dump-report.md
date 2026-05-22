# Dump report

Generated: 2026-05-22T01:07:43.589Z
Cutoff (5-year window): `2021-05-21`

## Counts

- attenders.json: **114** rows (from 114 membros)
- income_entries.json: **1855** rows (from 1709 entradas; 0 outside window, 1 bad dates)
- expense_entries.json: **1110** rows (from 1110 saidas; 0 outside window, 0 bad dates)
- designated_funds.json: **36** extra campanha funds (beyond the 5 base funds in seed-data.ts)

## Campanha fan-out

Each distinct (normalized) `campanha_nome` becomes its own designated fund.
Whitespace, casing, accents, and a small alias map (`compaicao→compaixao`, `anivesario→aniversario`, `planfetos→panfletos`) are normalized to collapse spelling variants.

| Fund                                             | Legacy lançamentos | Raw spellings observed                             |
| ------------------------------------------------ | -----------------: | -------------------------------------------------- |
| Desafio Construção                               |                 71 | `desafio construção`                               |
| Retiro de Pascoa                                 |                 46 | `retiro de pascoa`                                 |
| Aniversário da Igreja                            |                 24 | `anivesário da igreja`                             |
| Literatura Ebd                                   |                 19 | `literatura ebd`                                   |
| Encontro dos Homens                              |                 18 | `encontro dos homens`                              |
| Confraternização das Mulheres                    |                 17 | `confraternização  das mulheres`                   |
| Aluguel Social Casa Pastoral                     |                 15 | `aluguel social casa pastoral`                     |
| Acampamento Pascoa                               |                 13 | `acampamento pascoa`                               |
| Contribuição Para Encontro da Juventude          |                 12 | `contribuição para encontro da juventude`          |
| Compaixão e Graça                                |                 11 | `compaixão e graça`, `compaição e graça`           |
| Tv Infantil                                      |                 10 | `tv infantil`, `TV infantil`                       |
| Educação Cristã Missionaria                      |                  9 | `educação cristã missionaria`                      |
| Aniversário                                      |                  8 | `anivesário`                                       |
| Missões Infantil                                 |                  8 | `missões infantil`, `missoes infantil`             |
| Reforma e Construção                             |                  7 | `reforma e construção`                             |
| Auxílio Irmã Jane                                |                  7 | `auxílio irmã jane`                                |
| Casamento Social                                 |                  7 | `casamento social`                                 |
| Limpeza do Templo                                |                  7 | `limpeza do templo`                                |
| Confraternização Aniversario da Igreja           |                  6 | `confraternização aniversario da igreja`           |
| Manutenção do Carro Pr                           |                  6 | `manutenção do carro Pr`, `manutenção do carro pr` |
| Oferta Compaixão e Graça                         |                  5 | `oferta compaixão e graça`                         |
| Páscoa                                           |                  5 | `páscoa`                                           |
| Desafio Pulpito                                  |                  5 | `desafio pulpito`                                  |
| Construção                                       |                  3 | `construção`                                       |
| Oferta Gideões                                   |                  3 | `oferta gideões`                                   |
| Oferta Energisa                                  |                  2 | `oferta  energisa`                                 |
| Oferta Panfletos                                 |                  2 | `oferta planfetos`                                 |
| Campanha Natal                                   |                  1 | `campanha natal`                                   |
| Doação Luz                                       |                  1 | `doação luz`                                       |
| Venda de Bateria                                 |                  1 | `venda de bateria`                                 |
| Intercambio dos Jovens                           |                  1 | `intercambio dos jovens`                           |
| Oferta A Igreja Kairos                           |                  1 | `oferta  a igreja Kairos`                          |
| Partilhamento Tv Infantil                        |                  1 | `partilhamento tv infantil`                        |
| Venda da Churrasqueira de Frango                 |                  1 | `venda da churrasqueira de frango`                 |
| Venda da Churrasqueira de Frango Segunda Parcela |                  1 | `venda da churrasqueira de frango segunda parcela` |
| Pulpito                                          |                  1 | `pulpito`                                          |

## Attender matching

- Fuzzy matches captured (sample, max 30): **30**

| Legacy name                   | Resolved to                     | Reason        |
| ----------------------------- | ------------------------------- | ------------- |
| Silvia Araújo da Silva        | Silvia Araújo da Silva Biezon   | token-subset  |
| Silvia Araujo da Silva        | Silvia Araújo da Silva Biezon   | token-subset  |
| Silvia Araujo da Silva        | Silvia Araújo da Silva Biezon   | token-subset  |
| Dirce Teixeira Golçalves      | Dirce Teixeira Gonçalves        | levenshtein=1 |
| Silvia Araujo da Silva        | Silvia Araújo da Silva Biezon   | token-subset  |
| Cleide Rosa                   | Cleide Rosa Silva               | token-subset  |
| Silvia Araujo da Silva        | Silvia Araújo da Silva Biezon   | token-subset  |
| Silvia Araújo da Silva        | Silvia Araújo da Silva Biezon   | token-subset  |
| Cleide Rosa                   | Cleide Rosa Silva               | token-subset  |
| Silvia Araujo da Silva        | Silvia Araújo da Silva Biezon   | token-subset  |
| Cleide Rosa                   | Cleide Rosa Silva               | token-subset  |
| Silvia Araújo da Silva        | Silvia Araújo da Silva Biezon   | token-subset  |
| Ana Carolina de Oliveira      | Ana Carolina de Oliveira Campos | token-subset  |
| Ana Carolina de Oliveira      | Ana Carolina de Oliveira Campos | token-subset  |
| Josimar da Silva Oliveira     | Jocimar da Silva Oliveira       | levenshtein=1 |
| Cleide Rosa                   | Cleide Rosa Silva               | token-subset  |
| Geni Pegorado                 | Jeni Pegoraro                   | levenshtein=2 |
| Solanje Martins Tavares       | Solange Martins Tavares         | levenshtein=1 |
| Giovanni Ratier Dos Santos    | Giovane Ratier dos Santos       | levenshtein=2 |
| josue c cuelllar silva        | Josué C Cuellar Silva           | levenshtein=1 |
| Joao Gabriel Pereira da Costa | joão Gabriel Pereira de Costa   | levenshtein=1 |
| Joicy Valeriano               | Joicy Valeriano Domingues       | token-subset  |
| Nadia Naira                   | Nadia Naira Wyzykowski          | token-subset  |
| Luiz Henrrique Lages          | luiz Henrrique Lages Nolasco    | token-subset  |
| Giovanni Ratier dos Santos    | Giovane Ratier dos Santos       | levenshtein=2 |
| Rafael machado da Silvva      | Rafael Machado da Silva         | levenshtein=1 |
| Sandra Carla Francisca        | Sandra Carla Francisco          | levenshtein=1 |
| Vandermir Vasques da Costa    | Vandemir Vasques da Costa       | levenshtein=1 |
| Áurea Coelho de Lima          | Urea Coelho de Lima             | levenshtein=1 |
| Yngracy Cerqueira de Moraes   | Ingracy Cerqueira De Moraes     | levenshtein=1 |

- Distinct unmatched legacy names: **73**

Top 20 unmatched (review and add as attenders if real, or normalize the spelling):

- 2× `Tiago Gomes da Silva`
- 2× `mary`
- 2× `Sandra Martins Tavares `
- 2× `Noe de Oliveira`
- 1× `Tânia Tavares Chamon`
- 1× `Cleide Rosa da Silva`
- 1× `Vitor Weiss de Araujo`
- 1× `jose Algusto`
- 1× `José Augusto de Araujo Silva`
- 1× `Maria Lúcia Rosa Ferreira`
- 1× `Pedro Dourado`
- 1× `Noé e Angela`
- 1× `Marco Antonio`
- 1× `Silvia de Araujo da Silva`
- 1× `Geni`
- 1× `Elizabethi RCS`
- 1× `Ana Patricia Gomes`
- 1× `Priscila Ferreira`
- 1× `Donizete`
- 1× `Dirce Silva Gomes Ara`

## Unmapped destinos (fell through to "Outras Despesas")

Distinct unmapped: **112**

- 3× `gaz de cozinha`
- 2× `pax real`
- 2× `cesta basica - doação`
- 1× `correção de cálculo sobre novo salário mínimo`
- 1× `presente recepção novos membros`
- 1× `2 parcela portão de acesso aos banheiros`
- 1× `despesas acampadentro`
- 1× `mautenção de instrumento musical`
- 1× `reforma da quadra de areia`
- 1× `mão de abra - quadra de areia`
- 1× `mao de obra segunda parcela`
- 1× `rede de proteção quadra de areia`
- 1× `pagamento tributo rf pr`
- 1× `homenagem ao dia do pastor`
- 1× `mautenção das instalações`
- 1× `reforma - isntalação de lixeira`
- 1× `escola bíblica de férias`
- 1× `auxílio social a membro`
- 1× `reforma instalação portas de alumínio`
- 1× `assistencia social cesta basica`
- 1× `presente  biblia branca a noivos`
- 1× `jantar comemoração cha de panelas`
- 1× `aluguel de andaimes stilo locações`
- 1× `acessórios de som (microfones)`
- 1× `evangelismo doação de panetone`
- 1× `missoões nacionais referente a janeiro 2023`
- 1× `soleira de granito janela dos fundos`
- 1× `rede e lona para cama elástica - shopee`
- 1× `liquidificador para a cozinha`
- 1× `lembrança dia das maes`
