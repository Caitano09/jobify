const express = require('express')
const app = express()

const bodyParser = require('body-parser')

const sqlite3 = require('sqlite3')

const port = process.env.PORT /*Porta do servidor online*/ || 3000 

const path = require('path')

const dbConnection = new sqlite3.Database(path.resolve(__dirname, 'banco.sqlite'),
    sqlite3.OPEN_READWRITE || sqlite3.OPEN_CREATE, (err) => {
        if (err) {
            console.log('erro: ' + err)
        }
        else {
            console.log('conectado a database banco.sqlite')
        }
    });

/*app.use('/admin', (req, res, next)=>{
    //console.log(req.hostname)
    if(req.hostname == 'localhost'){
        next()
    }else{
        res.send('Not Allowed')
    }
})*/

app.set('views', path.join(__dirname, 'views'/*pasta views esse parametro */))    
app.set('view engine', 'ejs')

app.use(express.static(path.join(__dirname,'public')))
app.use(bodyParser.urlencoded({ extended: true }))  

app.get('/', async (request, response) => {
    const db = await dbConnection

    let aux /*variavel auxiliar para fazer vagas da mesma categoria ficarem sobre o mesmo titulo
    invez de um titulo para cada vaga*/

    await db.all(`select * from categorias join 
                    vagas where categorias.id = vagas.categoriaId order by categoria`, [], (err, categorias) => {
        if (err) {
            console.log('erro: ' + err)
        }
        else {
            response.render('home', {
                categorias,
                aux
            })
        }
    })

})

app.get('/vaga/:id', async (request, response) => {
    //console.log(request.params)
    const db = await dbConnection
    await db.get('select * from vagas where id = ' + request.params.id, [], (err, vaga) => {
        if (err) {
            console.log('erro: ' + err)
        }
        else {
            response.render('vaga', {
                vaga
            })
        }
    })
})

app.get('/admin', (req, res) => {
    res.render('admin/home')
})
app.get('/admin/categorias', async (req, res) => {
    const db = await dbConnection

    await db.all(`select * from categorias`, [], (err, categorias) => {
        if (err) {
            console.log('erro: ' + err)
        }
        else {
            res.render('admin/categorias', {
                categorias
            })
        }
    })
})

app.get('/admin/categorias/delete/:id', async (req, res) => {

    const db = await dbConnection
    await db.run('delete from categorias where id = ' + req.params.id)
    res.redirect('/admin/categorias')
})

app.get('/admin/categorias/nova', (req, res) => {
    res.render('admin/nova-categoria')

})

app.post('/admin/categorias/nova', async (req, res) => {
    //res.send(req.body)
    const db = dbConnection
    const { categoria } = req.body
    await db.run(`insert into categorias (categoria) values ('${categoria}');`)
    res.redirect('/admin/categorias')
})

app.get('/admin/categorias/editar/:id', async (req, res) => {
    const db = await dbConnection

    await db.get('select * from categorias where id = ' + req.params.id, [], (err, categoria) => {
        if (err) {
            console.log('erro: ' + err)
        }
        else {
            res.render('admin/editar-categoria', {
                categoria
                
            })
        }
    })

})

app.post('/admin/categorias/editar/:id', async (req, res) => {
    //res.send(req.body)
    const db = dbConnection
    const { id } = req.params
    const {categoria } = req.body
    await db.run(`update categorias set categoria = '${categoria}' where id = '${id}';`)
    res.redirect('/admin/categorias')
})


app.get('/admin/vagas', async (req, res) => {

    const db = await dbConnection

    await db.all(`select * from vagas`, [], (err, vagas) => {
        if (err) {
            console.log('erro: ' + err)
        }
        else {
            res.render('admin/vagas', {
                vagas
            })
        }
    })

})

app.get('/admin/vagas/delete/:id', async (req, res) => {

    const db = await dbConnection
    await db.run('delete from vagas where id = ' + req.params.id)
    res.redirect('/admin/vagas')
})

app.get('/admin/vagas/nova', async (req, res) => {
    const db = await dbConnection

    await db.all('select * from categorias', [], (err, categorias) => {
        if (err) {
            console.log('erro: ' + err)
        }
        else {
            res.render('admin/nova-vaga', {
                categorias
            })
        }
    })

})

app.post('/admin/vagas/nova', async (req, res) => {
    //res.send(req.body)
    const db = dbConnection
    const { titulo, descricao, categoria } = req.body
    await db.run(`insert into vagas (categoriaId, titulo, descricao) values ('${categoria}', '${titulo}', '${descricao}' );`)
    res.redirect('/admin/vagas')
})

app.get('/admin/vagas/editar/:id', async (req, res) => {
    const db = await dbConnection

    await db.all('select * from categorias', [], (err, categorias) => {
        if (err) {
            console.log('erro: ' + err)
        }
        else {
            db.get('select * from vagas where id = ' + req.params.id, [], (err, vaga) => {
                if (err) {
                    console.log('erro: ' + err)
                }
                else {
                    res.render('admin/editar-vaga', {
                        categorias,
                        vaga
                    })
                }
            })
        }
    })

})

app.post('/admin/vagas/editar/:id', async (req, res) => {
    //res.send(req.body)
    const db = dbConnection
    const { id } = req.params
    const { titulo, descricao, categoria } = req.body
    await db.run(`update vagas set categoriaId = '${categoria}', titulo = '${titulo}', descricao = '${descricao}' where id = '${id}';`)
    res.redirect('/admin/vagas')
})

const init = async () => {
    const db = await dbConnection
    await db.run('create table if not exists categorias (id INTEGER PRIMARY KEY, categoria TEXT);')
    await db.run('create table if not exists vagas (id INTEGER PRIMARY KEY, categoriaId INTEGER, titulo TEXT, descricao TEXT);')
    //const categoria = 'Marketing team'
    //await db.run(`insert into categorias (categoria) values ('${categoria}');`)
    //const vaga = 'Social Media (San Francisco)'
    //const descricao = 'Vaga para social media que fez o Fullstack Lab'
    //await db.run(`insert into vagas (categoriaId, titulo, descricao) values (2, '${vaga}', '${descricao}' );`)
    //await db.run(`update vagas set categoriaId = 2 where id = 2`)
}

init()

app.listen(port, (err) => {
    if (err) {
        console.log('Não foi possível iniciar o servidor do jobify.')
    }
    else {
        console.log('servidor do jobify rodando...')
    }
})