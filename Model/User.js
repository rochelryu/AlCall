let db, config;
const ent = require('ent');
let fsx = require('fs');


module.exports = (_db, _config) =>{
    db = _db;
    config = _config;
    return User;
}

let User = class {
    static SetUser(num, content, ref, type){
        return new Promise((next)=>{
            db.query("INSERT INTO user (numbers, money, ref, type_id) VALUES (?,?,?,?)", [num, content, ref, parseInt(type,10)])
                .then((results)=>{
                    next(results);
                }).catch((err)=>{
                next(err);
            });
        });
    }
    static setMessage(user, admin, content){
        return new Promise((next)=>{
            db.query("INSERT INTO messages (user_id, admin_id, content) VALUES (?,?,?)", [parseInt(user, 10), parseInt(admin, 10), content])
                .then((results)=>{
                    db.query("UPDATE user SET statut = ?, admin_user = ? WHERE id = ?", [1, parseInt(admin, 10), parseInt(user,10)])
                        .then((result)=>{
                            next(result);
                        }).catch((error)=>{
                            next(error);
                    })
                }).catch((err)=>{
                next(err);
            });
        });
    }

    static setPass(me, old, news){
        return new Promise((next)=>{
            db.query("SELECT * FROM admin WHERE id = ? AND pass = ?", [parseInt(me, 10), old])
                .then((results)=>{
                    if(results[0] !== undefined){
                        db.query("UPDATE admin SET pass = ? WHERE id = ?", [news, parseInt(me, 10)])
                            .then((result)=>{
                                next(result);
                            }).catch((error)=>{
                            next(error);
                        })
                    }
                    else{
                        next(new Error("Mauvais User"))
                    }
                }).catch((err)=>{
                next(err);
            });
        });
    }


    static setAdmin(pseudo, password){
        return new Promise((next)=>{
            db.query("INSERT INTO admin (pseudo, pass) VALUES (?,?)", [pseudo, password])
                .then((results)=>{
                    next(results);
                }).catch((err)=>{
                next(err);
            });
        });
    }
    static getAllInAwait(){
        return new Promise((next)=>{
            db.query("SELECT *, user.id as ident FROM user LEFT JOIN type ON user.type_id = type.id WHERE statut = 0")
                .then((results)=>{
                    next(results);
                }).catch((err)=>{
                next(err);
            });
        });
    }

    static getUserByMonth(month, years, type){
        return new Promise((next)=>{
            db.query("SELECT COUNT(DISTINCT user.id) num, AVG(money) moyenne, type.name FROM user LEFT JOIN type ON user.type_id = type.id WHERE MONTH(user.register_date) = ? AND YEAR(user.register_date) = ? AND user.type_id = ?", [parseInt(month,10), parseInt(years,10), parseInt(type,10)])
                .then((results)=>{
                    next(results[0]);
                }).catch((err)=>{
                next(err);
            });
        });
    }
    static getUserByMonth(type){
        return new Promise((next)=>{
            db.query("SELECT COUNT(DISTINCT user.id) num, AVG(money) moyenne, type.name FROM user LEFT JOIN type ON user.type_id = type.id WHERE user.type_id = ?", [parseInt(type,10)])
                .then((results)=>{
                    next(results[0]);
                }).catch((err)=>{
                next(err);
            });
        });
    }
    static getAllUserByMonth(month, years){
        return new Promise((next)=>{
            db.query("SELECT COUNT(DISTINCT user.id) as num FROM user WHERE MONTH(user.register_date) = ? AND YEAR(user.register_date) = ?", [parseInt(month,10), parseInt(years,10)])
                .then((results)=>{
                    next(results[0]);
                }).catch((err)=>{
                next(err);
            });
        });
    }

    static getUserByYears(years){
        return new Promise((next)=>{
            db.query("SELECT COUNT(DISTINCT id) num FROM user WHERE YEAR(register_date) = ? ", [parseInt(years,10)])
                .then((results)=>{
                    next(results[0]);
                }).catch((err)=>{
                next(err);
            });
        });
    }


    static getAllInfo(){
        return new Promise((next)=>{
            db.query("SELECT COUNT(DISTINCT id) num FROM user")
                .then((results)=>{
                    next(results[0]);
                }).catch((err)=>{
                next(err);
            });
        });
    }

    static getAllInSend(){
        return new Promise((next)=>{
            db.query("SELECT * FROM user LEFT JOIN type ON user.type_id = type.id WHERE statut = 1 ORDER BY user.id DESC")
                .then((results)=>{
                    next(results);
                }).catch((err)=>{
                next(err);
            });
        });
    }
    static getUserById(id){
        return new Promise((next)=>{
            db.query("SELECT * FROM user WHERE id = ?", [parseInt(id, 10)])
                .then((results)=>{
                    next(results[0]);
                }).catch((err)=>{
                next(err);
            });
        });
    }
    static getAllAdmin(){
        return new Promise((next)=>{
            db.query("SELECT * FROM admin ORDER BY id DESC")
                .then((results)=>{
                    next(results);
                }).catch((err)=>{
                next(err);
            });
        });
    }


    static getNumAdmin(id){
        return new Promise((next)=>{
            db.query("SELECT COUNT(DISTINCT id) as number FROM messages WHERE admin_id = ?", [parseInt(id, 10)])
                .then((results)=>{
                    next(results[0]);
                }).catch((err)=>{
                next(err);
            });
        });
    }
    static userExist(login,password){
        return new Promise((next) => {
            db.query("SELECT id FROM admin WHERE pseudo = ? AND pass = ?", [login, password])
                .then((result)=>{
                    if (result[0] !== undefined){
                        db.query("UPDATE admin SET login_date = NOW() WHERE admin.id = ?", [parseInt(result[0].id, 10)])
                            .then((results)=>{
                                db.query("SELECT * FROM admin WHERE id = ?", [parseInt(result[0].id, 10)])
                                    .then((result)=> {
                                        next(result[0]);
                                    }).catch((error) => {
                                    next(error.message)
                                })
                            }).catch((error) =>{
                            next(error)});
                    }
                    else{
                        next(new Error("Identification echoué Veuillez Recommencer"))
                    }
                }).catch((err) => {
                next(new Error("Erreur"))
            })
        })
    }
}