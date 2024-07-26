const mysql = require('mysql2');
const config = require('./config');

const connection = mysql.createConnection(config.mysql);
const waktu = new Date();

function query(sql, values) {
    return new Promise((resolve, reject) => {
        connection.query(sql, values, (e, result, fields) => {
            if (e) {
                reject(e);
            }
            else {
                resolve(result);
            }
        })
    })
}

function close() {
    return new Promise((resolve, reject) => {
        connection.end((e) => {
            if (e) {
                reject(e);
            } else {
                resolve();
            }
        })
    })
}

function tinsert(table, data) {
    data['created_at'] = waktu;
    data['is_deleted'] = 0;
    var columns = Object.keys(data).join(', ');
    var values = Object.values(data);
    var placeholders = new Array(values.length).fill('?').join(', ');
    var sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
    return query(sql, values);
}

function tupdate(table, data, where) {
    data['updated_at'] = waktu;
    var set = Object.keys(data).map((key) => `${key} = ?`).join(', ');
    var values = [...Object.values(data), ...Object.values(where)];
    var sql = `UPDATE ${table} SET ${set} WHERE ?`;
    return query(sql, values);
}

function tdelete(table,id){
    return tupdate(table, {deleted_at: waktu,is_deleted: 1}, {id: id});
}

module.exports = {
    query,
    close,
    tinsert,
    tupdate,
    tdelete
};
