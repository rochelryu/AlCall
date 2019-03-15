const express = require('express');
const nodemailer = require('nodemailer');
const fs = require('fs');
const readline = require('readline');
const twig = require('twig');
const {google} = require('googleapis');
let bodyParser = require('body-parser');
const morgan = require('morgan')('dev');
const crypto = require('crypto');
const config = require('./config');
const BulkSMS = require('bulksms');
const session = require('express-session');
const expressValidator = require('express-validator');
const cookieParser = require('cookie-parser');
const SMS = new BulkSMS(config.sms.user, config.sms.pass);

// Ceci est un scope.... google nous donne 4 type de scope et chaque scope à des permissions particulière.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
// Le fichier token.json est un token qui est généré afin de pouvoir authentifié toute action mené dans mon app.
const TOKEN_PATH = 'token.txt';

//Module sql mais travailler pour optimisation
const mysql = require('promise-mysql');

mysql.createConnection({
    host: config.db.host,
    database: config.db.database,
    user: config.db.user,
    password: config.db.password
}).then((db) => {
    const User = require('./Model/User')(db, config);
    console.log(`CONNEXION ETABLIE AVEC LA BD`);
    let holdId = null;  // permettant de mettre un drapeau sur le dernier mail traité.
    let moment = 0; //complement du drapeau
    const app = express();
    const https = require('http').createServer(app);
    let io = require('socket.io')(https);

    app.use(expressValidator());
    app.use(session({
        secret: config.session.secret,
        resave: config.session.resave,
        saveUninitialized: config.session.saveUninitialized
    }));
    app.use(express.static(`${__dirname}/Public`));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(cookieParser());
    app.use(morgan);
    const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'decembre']

    // simple fonction pour verifié le typeof d'une variable. utilisé pour ratraper mes catch.
    function isErr(data){
        return data instanceof Error;
    }
// Chargement des indentifiant gmail de Alcall file.
fs.readFile('credentials.txt', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    authorize(JSON.parse(content), getRecentEmail);
});

/**
 * Je travaille l'autentification avec le module natif de Gmail Oauth2
 * Vous pouvez integrer tout autre type d'authentification via service Gmail (JWT, PASSPORT JS, ETC...)
  */
function authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Lecture du token
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}


/**
 * getNewToken met permet de genéré un token et signé chaque jour en mode offline par google.
 */
function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
            });
            callback(oAuth2Client);
        });
    });
}

/* Fonction pour recuperer le dernier mail.
*/
function getRecentEmail(auth) {
    // En fait on peut recupere plus que le dernier mail tout depend de params maxResults
    let gmail = google.gmail({version: 'v1', auth});
    gmail.users.messages.list({auth: auth, userId: 'me', maxResults: 1}, function (err, response) {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }

        let message_id = response['data']['messages'][0]['id'];
        holdId = (holdId === null) ? message_id : holdId;
        if (holdId !== message_id || moment === 0) {
            moment = 1;
            holdId = message_id;
            gmail.users.messages.get({auth: auth, userId: 'me', id: message_id}, async function (err, response) {
                if (err) {
                    getRecentEmail(auth);
                }

                let message_raw = response.data.payload.body.data; //parts[0].body.data
                fs.writeFile('message.txt', JSON.stringify(message_raw), (err) => {
                    if (err) {
                        getRecentEmail(auth);
                    }
                    console.log('Log to message.txt');
                    getRecentEmail(auth);
                });
                /*message_raw est crypter
                * en base64
                * la class Buffer est depricié par node.
                * il existe des nouvelles methode de Buffer qui sont recommandé
                * Buffer.alloc(), Buffer.allocUnsafe(), etc...
                * la methode que j'ai utilisé est déprécié du faite qu'il utilse un algorithme de trie par corespondance d'où plus lent que les autres cité au-dessus mais beaucoup plus facile à mêttre en place.
                * A vous de voir ce que vous voulez utilisé Pour vos différents projets
                 */
                const data = message_raw;
                let buff = new Buffer(data, 'base64');
                let text = buff.toString();

                //une fois le decryptage terminé on peut utiliser les regexp pour rechercher nos chaine de charactère mais il y a beaucoup plus facile
                //En effet en JS tout est objet (tout comme en python) du coups chaqque objet à une methode prototype indexOf()
                //Donc je recupère la position du mot cherché puis je fais substring afin de recupéré la chaine de charactère qui m'intéresse.
                let ele = text.indexOf('From:');
                let props = text.indexOf('Pin');
                let isIntent = text.indexOf('pin');
                let isFocus = text.indexOf('PIN');
                let isMail = (props !== -1)? props: -1;
                isMail = (isIntent !== -1)? isIntent: isMail;
                isMail = (isFocus !== -1)? isFocus: isMail;

                if (ele !== -1 && isMail !== -1) {
                    const number = text.substring(ele + 6, ele + 17);
                    const pin = text.substring(isMail + 4, isMail + 9);
                    let eme = text.indexOf('money');
                    let recharge = text.indexOf('recharge');
                    let sms = text.indexOf('sms');
                    let internet = text.indexOf('internet');
                    let facture = text.indexOf('CIE ou SODECI');
                    if(eme !== -1){
                        const money = text.substring(eme + 6, text.length - 1);
                        const send = await User.SetUser(number, money, pin, 1);
                        if (!isErr(send)) {
                            //après avoir vérifier que ma constante send n'est pas ramené une erreur
                            //je fais le travail d'envoie de sms par Bulksms.
                            //il existe plusieurs autres solution par exemple twilio, joblaim, focusSms, etc...
                            const numbero = '+'+number;
                            console.log('Insertion de : ' + numbero);
                            let hours = new Date().getHours(); //recupère l'heure du current_times. qui est de type number
                            //Atention dans mon if ci-dessous j'ai mis 17 parce que 17h 01 à pour heure 17 ainsi que 17h 59 min 59 sec
                            // Or 18h 00 a pour heure 18 ainsi que 18h 59min...
                            //Moi mon service envoie des sms Different entre selon l'horaire . une fois 18h le message est tout autre choses.
                            if(hours >= 8 && hours <= 17){
                                SMS.send(numbero, 'Dans moins de 30 minutes votre demande sera prise en compte.', (err, result) => {
                                    if (err){
                                        console.error("message non envoyé : " + err);
                                    }
                                    else {
                                        console.log("message envoyé : " + result)
                                    }
                                });
                                getRecentEmail(auth);
                            }
                            else {
                                SMS.send(numbero, 'Dans moins de 05 heures votre demande sera prise en compte.', (err, result) => {
                                    if (err){
                                        console.error("message non envoyé : " + err);
                                    }
                                    else {
                                        console.log("message envoyé : " + result)
                                    }
                                });
                                getRecentEmail(auth);
                            }
                        }
                        else {
                            console.log('Problème rencontré, Insertion de :' + number);
                            getRecentEmail(auth);
                        }
                    }
                    if(recharge !== -1){
                        const money = text.substring(recharge + 9, text.length - 1);
                        const send = await User.SetUser(number, money, pin, 3);
                        if (!isErr(send)) {
                            //après avoir vérifier que ma constante send n'est pas ramené une erreur
                            //je fais le travail d'envoie de sms par Bulksms.
                            //il existe plusieurs autres solution par exemple twilio, joblaim, focusSms, etc...
                            const numbero = '+'+number;
                            console.log('Insertion de : ' + numbero);
                            let hours = new Date().getHours(); //recupère l'heure du current_times. qui est de type number
                            //Atention dans mon if ci-dessous j'ai mis 17 parce que 17h 01 à pour heure 17 ainsi que 17h 59 min 59 sec
                            // Or 18h 00 a pour heure 18 ainsi que 18h 59min...
                            //Moi mon service envoie des sms Different entre selon l'horaire . une fois 18h le message est tout autre choses.
                            if(hours >= 8 && hours <= 17){
                                SMS.send(numbero, 'Dans moins de 30 minutes votre demande sera prise en compte.', (err, result) => {
                                    if (err){
                                        console.error("message non envoyé : " + err);
                                    }
                                    else {
                                        console.log("message envoyé : " + result)
                                    }
                                });
                                getRecentEmail(auth);
                            }
                            else {
                                SMS.send(numbero, 'Dans moins de 05 heures votre demande sera prise en compte.', (err, result) => {
                                    if (err){
                                        console.error("message non envoyé : " + err);
                                    }
                                    else {
                                        console.log("message envoyé : " + result)
                                    }
                                });
                                getRecentEmail(auth);
                            }
                        }
                        else {
                            console.log('Problème rencontré, Insertion de :' + number);
                            getRecentEmail(auth);
                        }
                    }
                    if(sms !== -1){
                        const money = text.substring(sms + 4, text.length - 1);
                        const send = await User.SetUser(number, money, pin, 4);
                        if (!isErr(send)) {
                            //après avoir vérifier que ma constante send n'est pas ramené une erreur
                            //je fais le travail d'envoie de sms par Bulksms.
                            //il existe plusieurs autres solution par exemple twilio, joblaim, focusSms, etc...
                            const numbero = '+'+number;
                            console.log('Insertion de : ' + numbero);
                            let hours = new Date().getHours(); //recupère l'heure du current_times. qui est de type number
                            //Atention dans mon if ci-dessous j'ai mis 17 parce que 17h 01 à pour heure 17 ainsi que 17h 59 min 59 sec
                            // Or 18h 00 a pour heure 18 ainsi que 18h 59min...
                            //Moi mon service envoie des sms Different entre selon l'horaire . une fois 18h le message est tout autre choses.
                            if(hours >= 8 && hours <= 17){
                                SMS.send(numbero, 'Dans moins de 30 minutes votre demande sera prise en compte.', (err, result) => {
                                    if (err){
                                        console.error("message non envoyé : " + err);
                                    }
                                    else {
                                        console.log("message envoyé : " + result)
                                    }
                                });
                                getRecentEmail(auth);
                            }
                            else {
                                SMS.send(numbero, 'Dans moins de 05 heures votre demande sera prise en compte.', (err, result) => {
                                    if (err){
                                        console.error("message non envoyé : " + err);
                                    }
                                    else {
                                        console.log("message envoyé : " + result)
                                    }
                                });
                                getRecentEmail(auth);
                            }
                        }
                        else {
                            console.log('Problème rencontré, Insertion de :' + number);
                            getRecentEmail(auth);
                        }
                    }
                    if(internet !== -1){
                        const money = text.substring(internet + 9, text.length - 1);
                        const send = await User.SetUser(number, money, pin, 2);
                        if (!isErr(send)) {
                            //après avoir vérifier que ma constante send n'est pas ramené une erreur
                            //je fais le travail d'envoie de sms par Bulksms.
                            //il existe plusieurs autres solution par exemple twilio, joblaim, focusSms, etc...
                            const numbero = '+'+number;
                            console.log('Insertion de : ' + numbero);
                            let hours = new Date().getHours(); //recupère l'heure du current_times. qui est de type number
                            //Atention dans mon if ci-dessous j'ai mis 17 parce que 17h 01 à pour heure 17 ainsi que 17h 59 min 59 sec
                            // Or 18h 00 a pour heure 18 ainsi que 18h 59min...
                            //Moi mon service envoie des sms Different entre selon l'horaire . une fois 18h le message est tout autre choses.
                            if(hours >= 8 && hours <= 17){
                                SMS.send(numbero, 'Dans moins de 30 minutes votre demande sera prise en compte.', (err, result) => {
                                    if (err){
                                        console.error("message non envoyé : " + err);
                                    }
                                    else {
                                        console.log("message envoyé : " + result)
                                    }
                                });
                                getRecentEmail(auth);
                            }
                            else {
                                SMS.send(numbero, 'Dans moins de 05 heures votre demande sera prise en compte.', (err, result) => {
                                    if (err){
                                        console.error("message non envoyé : " + err);
                                    }
                                    else {
                                        console.log("message envoyé : " + result)
                                    }
                                });
                                getRecentEmail(auth);
                            }
                        }
                        else {
                            console.log('Problème rencontré, Insertion de :' + number);
                            getRecentEmail(auth);
                        }
                    }
                    if(facture !== -1){
                        const money = text.substring(facture + 24, text.length - 1);
                        const send = await User.SetUser(number, money, pin, 5);
                        if (!isErr(send)) {
                            //après avoir vérifier que ma constante send n'est pas ramené une erreur
                            //je fais le travail d'envoie de sms par Bulksms.
                            //il existe plusieurs autres solution par exemple twilio, joblaim, focusSms, etc...
                            const numbero = '+'+number;
                            console.log('Insertion de : ' + numbero);
                            let hours = new Date().getHours(); //recupère l'heure du current_times. qui est de type number
                            //Atention dans mon if ci-dessous j'ai mis 17 parce que 17h 01 à pour heure 17 ainsi que 17h 59 min 59 sec
                            // Or 18h 00 a pour heure 18 ainsi que 18h 59min...
                            //Moi mon service envoie des sms Different entre selon l'horaire . une fois 18h le message est tout autre choses.
                            if(hours >= 8 && hours <= 17){
                                SMS.send(numbero, 'Dans moins de 30 minutes votre demande sera prise en compte.', (err, result) => {
                                    if (err){
                                        console.error("message non envoyé : " + err);
                                    }
                                    else {
                                        console.log("message envoyé : " + result)
                                    }
                                });
                                getRecentEmail(auth);
                            }
                            else {
                                SMS.send(numbero, 'Dans moins de 05 heures votre demande sera prise en compte.', (err, result) => {
                                    if (err){
                                        console.error("message non envoyé : " + err);
                                    }
                                    else {
                                        console.log("message envoyé : " + result)
                                    }
                                });
                                getRecentEmail(auth);
                            }
                        }
                        else {
                            console.log('Problème rencontré, Insertion de :' + number);
                            getRecentEmail(auth);
                        }
                    }
                    if(eme === -1 && sms === -1 && internet === -1 && facture === -1 && recharge === -1) {
                        const money = "N/A";
                        const send = await User.SetUser(number, money, pin, 6);
                        if (!isErr(send)) {
                            //après avoir vérifier que ma constante send n'est pas ramené une erreur
                            //je fais le travail d'envoie de sms par Bulksms.
                            //il existe plusieurs autres solution par exemple twilio, joblaim, focusSms, etc...
                            const numbero = '+'+number;
                            console.log('Insertion de : ' + numbero);
                            let hours = new Date().getHours(); //recupère l'heure du current_times. qui est de type number
                            //Atention dans mon if ci-dessous j'ai mis 17 parce que 17h 01 à pour heure 17 ainsi que 17h 59 min 59 sec
                            // Or 18h 00 a pour heure 18 ainsi que 18h 59min...
                            //Moi mon service envoie des sms Different entre selon l'horaire . une fois 18h le message est tout autre choses.
                            if(hours >= 8 && hours <= 17){
                                SMS.send(numbero, 'Dans moins de 30 minutes votre demande sera prise en compte.', (err, result) => {
                                    if (err){
                                        console.error("message non envoyé : " + err);
                                    }
                                    else {
                                        console.log("message envoyé : " + result)
                                    }
                                });
                                getRecentEmail(auth);
                            }
                            else {
                                SMS.send(numbero, 'Dans moins de 05 heures votre demande sera prise en compte.', (err, result) => {
                                    if (err){
                                        console.error("message non envoyé : " + err);
                                    }
                                    else {
                                        console.log("message envoyé : " + result)
                                    }
                                });
                                getRecentEmail(auth);
                            }
                        }
                        else {
                            console.log('Problème rencontré, Insertion de :' + number);
                            getRecentEmail(auth);
                        }
                    }
                }
                else {
                    console.log('err rien encore');
                    getRecentEmail(auth);
                }
            });
        } else getRecentEmail(auth);
    });
}

    app.get('/login', async (req, res) =>{
        if(req.query.e == "1"){
            let error;
            (req.session.errors !== null) ? error = req.session.errors : error = null;
            req.session.errors = null;
            res.render(`${__dirname}/Public/login.twig`, { user: "nil", errors: error })
        }
        else{
            res.render(`${__dirname}/Public/login.twig`, { user: "nil" })
        }
    });
    app.post('/login', async (req, res) =>{
        req.check('user', "Pseudo ne doit pas être vide").notEmpty();
        req.check('pass', "Password ne doit pas être vide").notEmpty();

        const error = req.validationErrors();
        if(error){
            res.render(`${__dirname}/Public/login.twig`, { errors: error })
        }
        else{
            let user = req.body.user;
            let pass = req.body.pass;
            let password = crypto.createHmac('sha256', pass).update('I love cupcakes').digest('hex');
            const personC = await User.userExist(user, password);
            if (!isErr(personC)){
                req.session.alcall = personC;
                res.redirect('/');
            }
            else{
                res.render(`${__dirname}/Public/login.twig`, { error: 'Identification Echoué. Veuillez verifier vos cordonnées' })
            }
        }//res.render(`${__dirname}/public/form.twig`, { user: "nil" })
    });
    app.get('/', async (req, res)=>{
        if(req.session.alcall){
            let num = {};
            let mot = new Array();
            let stat = new Array();
            let month = new Date().getMonth();
            let years = new Date().getFullYear();
            month = parseInt(month, 10) + 1;
            years = parseInt(years, 10);
            for(let i = 0; i < 3; i++){
                if (month - i <= 0){
                    const beta = 12 - (i - 1);
                    const Ye = years - 1;
                    mot[i] = {};
                    mot[i].month = beta;
                    mot[i].years = Ye;
                }
                else {
                    mot[i] = {};
                    mot[i].month = month;
                    mot[i].years = years;
                }
                continue;
            }
            let admin = await User.getAllAdmin();
            const inAwait = await User.getAllInAwait();
            const inSend = await User.getAllInSend();
            const total = await User.getAllInfo();
            let tot = await User.getUserByMonth(1);
            num.send = inSend;
            num.await = inAwait;
            for(let i in admin){
                const mes = await User.getNumAdmin(admin[i].id);
                admin[i].message = mes.number;
                continue;
            }
            for(let i in mot){
                /*let content = await User.getUserByMonth(mot[i].month,mot[i].years, 1);
                let contentI = await User.getUserByMonth(mot[i].month,mot[i].years, 2);
                let contentR = await User.getUserByMonth(mot[i].month,mot[i].years, 3);
                let contentS = await User.getUserByMonth(mot[i].month,mot[i].years, 4);
                let contentF = await User.getUserByMonth(mot[i].month,mot[i].years, 5);
                let contentD = await User.getUserByMonth(mot[i].month,mot[i].years, 6);*/
                let contens = await User.getAllUserByMonth(mot[i].month, mot[i].years);
                /*mot[i].countMoney = content.num;
                mot[i].countI = contentI.num;
                mot[i].countR = contentR.num;
                mot[i].countS = contentS.num;
                mot[i].countF = contentF.num;
                mot[i].countD = contentD.num;*/
                mot[i].count = contens.num;
                mot[i].moi = mois[mot[i].month - 1];
                console.log("Dans la boucle pour string mois" + JSON.stringify(mot))
            }

            for(let i = years; i >= years - 2 ; i--){
                let content = await User.getUserByYears(i);
                content.years = i;
                stat.push(content);
                continue;
            }
            num.totalNum = total.num;
            num.totalMoy = parseInt(tot.moyenne, 10);
            num.mot = mot.reverse();
            console.log("FIN la boucle pour string mois" + JSON.stringify(num.mot))

            num.stat = stat.reverse();
            num.admin = admin;
            res.render(`${__dirname}/Public/tabs.twig`, {user: req.session.alcall, all: num});
        }
        else res.redirect('/login')
    });
    app.get('/logout', async (req, res) => {
        req.session.destroy((err) => {
            console.log(`DESTRUCTION D'UNE SESSION`)
        })
        res.redirect('/login')
    });

    app.use('*', (req, res) =>{
        res.render(`${__dirname}/Public/404.twig`)
    });

    /**
     * POur tout ce qui concerne le nom de mes variable, le nommage est individuel...
     * c'est plutôt le nom de fonction et Class qui sont ont des norme à respecter
     * Donc Priez de ne pas vous Concentrer sur mes nom de variable.
     */
    io.on('connection', (socket)=> {

        socket.on('newAdmin', async (data) => {
            let password = crypto.createHmac('sha256', data.password).update('I love cupcakes').digest('hex');
            let user = await User.setAdmin(data.pseudo, password);
        });
        socket.on('sendId', async (data) => {
            let user = await User.getUserById(data);
            socket.emit('resSendId', user);
        });
        socket.on('sendMessage', async (data) => {
            let user = await User.setMessage(data.id,data.me,data.message);
            if (!isErr(user)){
                let number = await User.getUserById(data.id);
                const num = '+'+number.numbers;
                SMS.send(num, data.message, (err, result) => {
                    if (err){
                        console.error("message non envoyé : " + err);
                    }
                    else {
                        socket.emit('ResSendMessage', {id:data.id,message:data.message})
                    }
                });
            }
            socket.emit('resSendId', user);
        });
        socket.on('changePass', async (data) => {
            let old = crypto.createHmac('sha256', data.old).update('I love cupcakes').digest('hex');
            let news = crypto.createHmac('sha256', data.news).update('I love cupcakes').digest('hex');
            let user = await User.setPass(data.me,old,news);
            (!isErr(user))? socket.emit('resChangePass', 0) : socket.emit('resChangePass', 1);
        });
    });
    https.listen(config.port, ()=>{
        console.log('ecoute sur ' + config.port)
    });
}).catch((error) =>{console.log(error.message)});