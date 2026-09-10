# Guia de Setup — Projecto Legacy

Este guia explica como preparar e correr o projecto completo (backend `legacy-api` + frontend `legacy-web`) numa máquina nova, do zero.

## Pré-requisitos

Antes de começar, confirma que tens instalado:

- **Node.js** (versão recente, 18+)
- **Docker** e **Docker Compose**
- **Git**

## 1. Clonar os repositórios

Cria uma pasta para o projecto e clona os dois repositórios lado a lado (não um dentro do outro):

```bash
mkdir ~/legacy-projeto
cd ~/legacy-projeto
git clone https://github.com/Emmaserver/Legacy.git legacy-api
git clone <url-do-repositorio-legacy-web> legacy-web
```

No final deves ter:

```
~/legacy-projeto/
  legacy-api/
  legacy-web/
```

## 2. Preparar o Backend (`legacy-api`)

```bash
cd ~/legacy-projeto/legacy-api

# 1. Subir o PostgreSQL via Docker
docker compose up -d

# 2. Confirmar que está a correr
docker ps

# 3. Criar o ficheiro .env
cp .env.example .env
```

Abre o `.env` e confirma que tem, no mínimo, estas duas variáveis:

```
DATABASE_URL="postgresql://legacy:legacy_dev_password@localhost:5432/legacy_db?schema=public"
JWT_SECRET="<gerar no passo seguinte>"
```

Gera um valor novo para o `JWT_SECRET` (não reutilizar o de outra máquina):

```bash
openssl rand -base64 32
```

Copia o valor gerado e cola-o no `.env`, na linha `JWT_SECRET="..."`.

Continua:

```bash
# 4. Instalar dependências
npm install

# 5. Gerar o Prisma Client
npx prisma generate

# 6. Aplicar as migrations (cria as tabelas)
npx prisma migrate deploy

# 7. Criar o utilizador Administrador inicial
npx prisma db seed

# 8. Arrancar o servidor
npm run start
```

O backend fica disponível em `http://localhost:3000`.

**Credenciais do administrador inicial:**
- Email: `admin@legacy.com`
- Password: `Admin@123`

(deve ser trocada assim que possível, é só para testes)

### Ver os dados da base de dados (opcional)

```bash
npx prisma studio
```

Abre em `http://localhost:5555`, mostra todas as tabelas com interface visual.

## 3. Preparar o Frontend (`legacy-web`)

Num **novo terminal**, deixando o backend a correr no anterior:

```bash
cd ~/legacy-projeto/legacy-web
npm install
```

Cria o ficheiro `.env.local`:

```bash
touch .env.local
```

E adiciona-lhe:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Arranca o servidor de desenvolvimento:

```bash
npm run dev
```

Como a porta 3000 já está ocupada pelo backend, o Next.js vai automaticamente escolher a porta seguinte livre (normalmente `3001`) — repara na mensagem do terminal para confirmar qual é.

## 4. Testar

1. Confirma que o backend está a correr (terminal 1) e o frontend também (terminal 2).
2. Abre no browser: `http://localhost:3001/login` (ajusta a porta se for diferente)
3. Faz login com `admin@legacy.com` / `Admin@123`
4. Deve autenticar com sucesso.

## Notas importantes

- **CORS**: o backend já está configurado para aceitar pedidos vindos de `http://localhost:3001`. Se o frontend arrancar numa porta diferente (ex: outra já estiver ocupada), o login vai falhar com erro de CORS até essa origem ser adicionada em `main.ts` (`app.enableCors({ origin: '...' })`).
- **Bases de dados não são partilhadas entre máquinas**: cada máquina tem o seu próprio PostgreSQL local via Docker. Os dados que cada um criar (produtos, vendas, clientes de teste) não aparecem na máquina do outro — só a estrutura das tabelas é partilhada via Git.
- **Para parar tudo**: `Ctrl+C` nos dois terminais, e `docker compose down` na pasta `legacy-api` se quiseres também parar o PostgreSQL.
