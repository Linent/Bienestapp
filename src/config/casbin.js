 const { newEnforcer } = require('casbin');
const {MongooseAdapter} = require('casbin-mongoose-adapter');
const path = require('path');
const config = require('./config');
const EventEmitter = require ('events');

class CasbinConfig extends EventEmitter{
    constructor() {
        super();
        this.config = config;
        // toda la tada que va a perdurar
        MongooseAdapter.newSyncedAdapter(config.MONGODB_URI)
        .then(adapter => {
            // ubicacion del modelo.conf
            const model = path.resolve(__dirname, '../../panaderia.conf');
            //cargar model and policy 
            //Crea una nueva instancia del adaptador mongoose para casbin. 
            return newEnforcer(model, adapter);
        }).then(enforcer => {
            this.enforcer = enforcer;
            // cargar las politicas
            return enforcer.loadPolicy();
        }).then(() => {
            this.emit('serverStart');
        })
        .catch((error) => {
            console.error('Error en la inicialización de Casbin:', error)
        });
    }

    static get instance() {
        return this._instance || (this._instance = new this())
    }
}

const casbinConfig = CasbinConfig.instance;
module.exports = casbinConfig; 