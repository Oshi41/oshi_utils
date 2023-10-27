import fs from "fs";
import crypto from 'crypto-js';
import {join_mkfile} from './index.js';
import machine_id from 'node-machine-id';
const {machineIdSync} = machine_id;

export default class Settings {
    constructor(filepath, pass = undefined) {
        /**
         * Filepath to settings
         * @type {string}
         */
        this.filepath = filepath;
        /**
         * Settings password
         * @type {string | undefined}
         */
        this.pass = pass;
        /**
         * Unique machine ID
         * @type {string}
         */
        this.iv = machineIdSync(true);
    }

    #decrypt(txt){
        let res = crypto.AES.decrypt(txt, this.pass, {iv: this.iv});
        return res.toString(crypto.enc.Utf8);
    }
    #encrypt(txt){
        let res = crypto.AES.encrypt(txt, this.pass, {iv: this.iv});
        return res.toString();
    }

    read(){
        if (!fs.existsSync(this.filepath))
            return;

        let json, raw = fs.readFileSync(this.filepath, 'utf-8');
        try {
            if (this.pass)
                raw = this.#decrypt(raw);
            json = JSON.parse(raw);
        } catch (e) {
            console.warn('Error during settings read:', e);
        }

        return json;
    }
    save(obj){
        join_mkfile(this.filepath);
        let json = JSON.stringify(obj, null, 2);
        if (this.pass)
            json = this.#encrypt(json);
        fs.writeFileSync(this.filepath, json, 'utf-8');
    }
}