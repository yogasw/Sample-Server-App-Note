'use strict'

const response = require('../libs/response');
const connection = require('../config/database');
const modelNotes = require('../models/modelNotes');
const dateFormat = require('dateformat');

//Controler Note
exports.home = function (req, res) {
    response.success('Welcome to Server Sample Note App API', res);
};
exports.insertNote = function (req, res) {
    let note = req.body.note;
    let id_category = req.body.id_category;
    let title = req.body.title;
    let time = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");

    if (typeof note == 'undefined' || typeof id_category == 'undefined' || typeof title == 'undefined') {
        response.errorWithCode(400, "Field note or id_category cannot null or empty", res)
    } else {
        connection.query(`INSERT INTO data_note set title=?, note=?, time=?, id_category=?;`, [title, note, time, id_category],
            function (error, rows, field) {
                if (error) {
                    response.errorWithCode(400, "Field note or id_category cannot null or empty", res)
                } else {
                    let sqlNew = 'SELECT data_note.id, data_note.title, data_note.note, data_note.time, ' +
                        'category_note.name as name_category, category_note.id as id_category ' +
                        'FROM data_note LEFT JOIN category_note ON data_note.id_category=category_note.id ' +
                        'ORDER BY data_note.id DESC LIMIT 1';

                    connection.query(sqlNew,
                        function (error, rows, field) {
                            if (error) {
                                response.errorWithCode(400, "Field note or id_category cannot null or empty", res)
                            } else {
                                let data = {
                                    error: false,
                                    data: rows,
                                    message: 'New data has been created',
                                }
                                response.success(data, res)
                            }
                        })
                }
            })
    }
};

exports.updateNote = function (req, res) {
    let id = req.params.id;
    let id_category = req.body.id_category;
    let note = req.body.note;
    let title = req.body.title;
    let sql = `UPDATE data_note SET `;
    sql = (title) ? sql.concat(`title="${title}" `) : sql;
    sql = (note && title) ? sql.concat(`, `) : sql;
    sql = (note) ? sql.concat(`note="${note}" `) : sql;
    sql = (note && id_category) ? sql.concat(`, `) : sql;
    sql = (id_category) ? sql.concat(`id_category="${id_category}" `) : sql;
    sql = sql.concat(`WHERE id="${id}" `);

    connection.query(sql,
        function (error, result, field) {
            if (error || !result.affectedRows) response.errorWithCode(400, "Update Note didn't work", res);
            else {
                if (result.affectedRows == 0) {
                    response.errorWithCode(400, "Update Note didn't work", res)
                } else {
                    connection.query(`SELECT * FROM data_note WHERE ID = ${id}`,
                        function (error, rows, field) {
                            if (error) {
                                response.errorWithCode(400, "Update Note didn't work", res)
                            } else {
                                let data = {
                                    error: false,
                                    data: rows,
                                    message: 'Note has been update!',
                                }
                                response.success(data, res)
                            }
                        })
                }
            }
        }
    )
};
exports.deleteNote = function (req, res) {
    connection.query(`delete from data_note where id =?`, [req.params.id],
        function (error, result, fields) {
            if (error) {
                response.errorWithCode(400, "Id Not Found", res)
            } else {
                if (result.affectedRows == 0) {
                    response.errorWithCode(400, "Id Not Found", res)
                } else {
                    let data = {
                        error: false,
                        id: req.params.id,
                        message: "Note has been deleted!"
                    }
                    response.success(data, res);
                }
            }
        }
    )
};

exports.note = function (req, res) {
    modelNotes.getCountQuery(req, res, function (sql, maxCount) {
        connection.query(sql, function (error, rows, field) {

            let page = req.query.page || 1;
            let limit = req.query.limit || 5;
            let end = (page - 1) * limit;
            let amount_page = Math.ceil((rows.length || 1) / limit);
            let next_page = (page * limit < maxCount) ? Number(page) + 1 : Number(page);

            sql = sql.concat(`LIMIT ${limit} OFFSET ${end}`);

            connection.query(sql, function (error, rows, field) {
                if (error) {
                    response.errorWithCode(400, "Note does not found", res);
                } else {
                    const data = {
                        status: 200,
                        amounts_note: maxCount,
                        amounts_page: amount_page,
                        current_page: Number(page),
                        next_page: next_page,
                        limit: limit,
                        values: rows,
                    };

                    (rows.length > 0) ? response.notes(data, res) : response.errorWithCode(400, 'Note does not found', res);
                }
            });
        })
    });
};
