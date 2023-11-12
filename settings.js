import fs from "fs";
import crypto from 'crypto-js';
import {join_mkfile} from './index.js';
import machine_id from 'node-machine-id';
import {EventEmitter} from 'events';

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

    #decrypt(txt) {
        let res = crypto.AES.decrypt(txt, this.pass, {iv: this.iv});
        return res.toString(crypto.enc.Utf8);
    }

    #encrypt(txt) {
        let res = crypto.AES.encrypt(txt, this.pass, {iv: this.iv});
        return res.toString();
    }

    use_fresh(interval = 200) {
        let cfg = {};
        fs.watchFile(this.filepath, {interval}, async () => {
            console.debug('loaded cfg from file changes');
            Object.keys(cfg).forEach(x=>delete cfg[x]);
            let source = await this.read() || {}
            // using the same instance
            Object.assign(cfg, source);
        });
        return {
            current: cfg,
            save: ()=>this.save(cfg || {}),
        }
    }

    async read(default_fn) {
        if (fs.existsSync(this.filepath)) {
            let raw = fs.readFileSync(this.filepath, 'utf-8');
            try {
                if (this.pass)
                    raw = this.#decrypt(raw);
                return JSON.parse(raw);
            } catch (e) {
                console.warn('Error during settings read:', e);
            }
        }

        if (default_fn) {
            let cfg = await default_fn();
            this.save(cfg);
            return cfg;
        }
    }

    save(obj) {
        join_mkfile(this.filepath);
        let json = JSON.stringify(obj, null, 2);
        if (this.pass)
            json = this.#encrypt(json);
        fs.writeFileSync(this.filepath, json, 'utf-8');
    }
}