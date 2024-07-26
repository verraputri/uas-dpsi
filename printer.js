const express = require('express');
const db = require('./db');
const ExcelJS = require('exceljs');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        var result = await db.query('SELECT * FROM dat_sensor WHERE is_deleted = 0 ORDER BY tgl_terima DESC');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sheet 1');
        const header1Data = ['Data Sensor', '', '', '', '', '', ''];
        const header1Row = worksheet.addRow(header1Data);
        worksheet.mergeCells('A1:G1');
        header1Row.font = { bold: true };
        const header2Data = [
            'ID', 'Sumber', 'Tanggal Diterima', 'Kelembapan Tanah', 'Kelembapan Udara', 'Suhu', 'Intensitas Cahaya'
        ];
        const header2Row = worksheet.addRow(header2Data);
        header2Row.font = { bold: true };
        worksheet.columns = [
            { key: 'id', width: 5 },
            { key: 'sumber', width: 10 },
            { key: 'tgl_terima', width: 20 },
            { key: 'soilhumid', width: 20 },
            { key: 'airhumid', width: 20 },
            { key: 'temp', width: 20 },
            { key: 'lightint', width: 20 }
        ];
        worksheet.addRows(result);

        worksheet.getCell('A1').alignment = { horizontal: 'center' };
        worksheet.getCell('B1:G1').alignment = { horizontal: 'center' };

        worksheet.getColumn('tgl_terima').eachCell(cell => {
            cell.numFmt = 'yyyy-mm-dd hh:mm:ss';
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Sensor.xlsx');

        workbook.xlsx.write(res)
            .then(() => {
                res.end();
                console.log('File Excel berhasil dikirim');
            })
            .catch((error) => {
                console.error('Terjadi kesalahan:', error);
                res.status(500).json({ error: 'File tidak bisa dikirim' });
            });
    }
    catch (e) {
        console.log('Error: ', e)
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/', async (req, res) => {
    var data = req.body;
    try {
        var where = [];
        var values = [];
        where.push('is_deleted = 1');
        if (data.length == 0) {
            where.push('1=1');
        } else {
            if (data.tgl_mulai && data.tgl_akhir) {
                where.push('tlg_terima BETWEEN ? AND ?');
                values.push(data.tgl_mulai, data.tgl_akhir);
            }
            if (data.sumber) {
                where.push(`sumber LIKE '%${data.sumber}%'`);
            }
        }
        where = where.join(' AND ');
        var result = await db.query(`SELECT * FROM dat_sensor WHERE ${where}`, values);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sheet 1');
        const header1Data = ['Data Sensor', '', '', '', '', '', ''];
        const header1Row = worksheet.addRow(header1Data);
        worksheet.mergeCells('A1:G1');
        header1Row.font = { bold: true };
        const header2Data = [
            'ID', 'Sumber', 'Tanggal Diterima', 'Kelembapan Tanah', 'Kelembapan Udara', 'Suhu', 'Intensitas Cahaya'
        ];
        const header2Row = worksheet.addRow(header2Data);
        header2Row.font = { bold: true };
        worksheet.columns = [
            { key: 'id', width: 5 },
            { key: 'sumber', width: 10 },
            { key: 'tgl_terima', width: 20 },
            { key: 'soilhumid', width: 20 },
            { key: 'airhumid', width: 20 },
            { key: 'temp', width: 20 },
            { key: 'lightint', width: 20 }
        ];
        worksheet.addRows(result);

        worksheet.getCell('A1').alignment = { horizontal: 'center' };
        worksheet.getCell('B1:G1').alignment = { horizontal: 'center' };

        worksheet.getColumn('tgl_terima').eachCell(cell => {
            cell.numFmt = 'yyyy-mm-dd hh:mm:ss';
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Sensor.xlsx');

        workbook.xlsx.write(res)
            .then(() => {
                res.end();
                console.log('File Excel berhasil dikirim');
            })
            .catch((error) => {
                console.error('Terjadi kesalahan:', error);
                res.status(500).json({ error: 'File tidak bisa dikirim' });
            });
    } catch (e) {
        console.log('Error : ', e);
        res.status(500).json({ error: 'Format filter salah' })
    }
});

router.use((req, res) => {
    res.status(404).send('404 Not Found');
});

module.exports = router;
