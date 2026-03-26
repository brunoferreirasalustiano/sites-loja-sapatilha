const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();

//CONFIGURAÇÃO DE CACHE (Para o "Automático" funcionar)
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});

const db = new sqlite3.Database('./banco.db');

//BANCO DE DADOS: Criação e População Inicial (18 PRODUTOS)
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        preco REAL,
        imagem_url TEXT,
        tamanhos TEXT
    )`);

    db.get("SELECT count(*) as total FROM produtos", (err, row) => {
        if (row && row.total === 0) {
            console.log("🚀 Populando banco com os 18 modelos...");
            const listaInicial = [
                ['Sapatilha Rosa Confort', 59.90, '/imagens-sapatilhas/1.jfif', '34,35,36,37,38,39'],
                ['Sapatilha Nude Laço', 59.90, '/imagens-sapatilhas/2.jfif', '34,35,36,37,38,39'],
                ['Sapatilha Preta Básica', 59.90, '/imagens-sapatilhas/3.jfif', '34,35,36,37,38,39'],
                ['Sapatilha Pink Arraso', 59.90, '/imagens-sapatilhas/4.jfif', '34,35,36,37,38,39'],
                ['Sapatilha Preta Strass', 59.90, '/imagens-sapatilhas/5.jfif', '34,35,36,37,38,39'],
                ['Sapatilha Preta Fina', 59.90, '/imagens-sapatilhas/6.jfif', '34,35,36,37,38,39'],
                ['Sapatilha Modelo 07', 59.90, '/imagens-sapatilhas/7.jfif', '34,35,36,37,38,39'],
                ['Sapatilha Modelo 08', 59.90, '/imagens-sapatilhas/8.jfif', '34,35,36,37,38,39'],
                ['Sapatilha Modelo 09', 59.90, '/imagens-sapatilhas/9.jfif', '34,35,36,37,38,39'],
                ['Sapatilha Modelo 10', 59.90, '/imagens-sapatilhas/10.jfif', '34,35,36,37,38,39'],
                ['Sapatilha Modelo 11', 59.90, '/imagens-sapatilhas/11.jfif', '34,35,36,37,38,39'],
                ['Sapatilha Modelo 12', 59.90, '/imagens-sapatilhas/12.jfif', '34,35,36,37,38,39'],
                ['Sapatilha Modelo 13', 59.90, '/imagens-sapatilhas/13.jfif', '34,35,36,37,38,39'],
                ['Sapatilha Modelo 14', 59.90, '/imagens-sapatilhas/14.jfif', '34,35,36,37,38,39'],
                ['Sapatilha Modelo 15', 59.90, '/imagens-sapatilhas/15.jfif', '34,35,36,37,38,39'],
                ['Sapatilha Modelo 16', 59.90, '/imagens-sapatilhas/16.jfif', '34,35,36,37,38,39'],
                ['Sapatilha Modelo 17', 59.90, '/imagens-sapatilhas/17.jfif', '34,35,36,37,38,39'],
                ['Sapatilha Modelo 18', 59.90, '/imagens-sapatilhas/18.jfif', '34,35,36,37,38,39']
            ];
            const stmt = db.prepare(`INSERT INTO produtos (nome, preco, imagem_url, tamanhos) VALUES (?, ?, ?, ?)`);
            listaInicial.forEach(p => stmt.run(p));
            stmt.finalize();
            console.log("✅ Banco de dados pronto!");
        }
    });
});

const upload = multer({ dest: './uploads/' });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/imagens-sapatilhas', express.static(path.join(__dirname, 'public/imagens-sapatilhas')));

// ROTA: LISTAR PRODUTOS
app.get('/api/produtos', (req, res) => {
    db.all('SELECT * FROM produtos', [], (err, rows) => res.json(rows));
});

// ROTA: ATUALIZAR TUDO (Nome, Preço, Foto e Tamanhos)
app.post('/api/atualizar-produto/:id', upload.single('foto'), (req, res) => {
    const { id } = req.params;
    const { nome, preco, tamanhos } = req.body;

    db.get('SELECT imagem_url FROM produtos WHERE id = ?', [id], (err, row) => {
        if (!row) return res.status(404).send("Produto não encontrado");

        let imagemUrl = row.imagem_url;

        if (req.file) {
            // Apaga a foto antiga se for um upload
            if (row.imagem_url.includes('/uploads/')) {
                const antigo = path.join(__dirname, row.imagem_url);
                if (fs.existsSync(antigo)) fs.unlinkSync(antigo);
            }
            imagemUrl = `/uploads/${req.file.filename}`;
        }

        const sql = `UPDATE produtos SET nome = ?, preco = ?, imagem_url = ?, tamanhos = ? WHERE id = ?`;
        db.run(sql, [nome, preco, imagemUrl, tamanhos, id], function(err) {
            if (err) return res.status(500).json({ success: false });
            res.json({ success: true });
        });
    });
});

//rota que o seu login.html está procurando
app.post('/api/login', (req, res) => {
    const { usuario, senha } = req.body;

    // Login padrão para teste
    if (usuario === 'admin' && senha === '1234') {
        res.json({ success: true });
    } else {
        // Se errar, avisa o site que deu errado
        res.status(401).json({ success: false, message: "Usuário ou senha inválidos" });
    }
});

// O Render vai preencher o process.env.PORT sozinho
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 Servidor rodando na porta ${PORT}`));