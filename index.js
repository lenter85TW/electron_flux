/**
 * Created by kimdoeun on 2017. 3. 16..
 */

var EventEmitter = require('events').EventEmitter;

var ipcMain = null;
var ipcRenderer = null;
var remote = null;
var windowList = [];
var main = null;
var mainStoreObj = null;
var emitter = new EventEmitter();

var mainDispatcher = {
    init: function init(mainIpc) {
        ipcMain = mainIpc;
        ipcMain.on('updateStore', function (event, dataName, data) {
            console.log("mainDispatcher 실행", dataName, data);
            if (mainStoreObj[dataName] !== data) {
                mainProcess.changeData(dataName, data);
            }
        });
    }
};

var rendererAction = {
    init: function init(remdererIpc) {
        ipcRenderer = remdererIpc;
    },
    updateStore: function updateStore(dataName, data) {
        console.log("rendereAction - updateStore", dataName, data);
        ipcRenderer.send('updateStore', dataName, data);
    }
};

var mainProcess = {

    init: function init(store) {
        mainStoreObj = store;
    },
    addWindow: function addWindow(winObj) {
        windowList.push(winObj);
    },
    removeWindow: function removeWindow(winObj) {
        var index = windowList.indexOf(winObj);
        windowList.splice(index, 1);
    },
    changeData: function changeData(dataName, newData) {
        console.log("mainStore - changeData 실행", dataName, newData);
        mainStoreObj[dataName] = newData;
        windowList.forEach(function (currentValue) {
            currentValue.webContents.send('dataChanged', dataName);
        });
    }
};

var rendererProcess = {


    init: function init(rendererRemoteMain, rendererIpc) {
        main = rendererRemoteMain;
        ipcRenderer = rendererIpc;
        mainStoreObj = main.getStore();
        ipcRenderer.on('dataChanged', this.DataChanged);
    },
    DataChanged: function DataChanged(event, dataName) {

        emitter.emit(dataName);
    },
    addListener: function addListener(eventType, func) {
        emitter.on(eventType, func);
    },
    removeListener: function removeListener(eventType, func) {
        emitter.removeListener(eventType, func);
    }
};

function getMainStoreObj() {
    return mainStoreObj;
}

exports.mainDispatcher = mainDispatcher;
exports.rendererAction = rendererAction;
exports.mainProcess = mainProcess;
exports.rendererProcess = rendererProcess;
exports.getMainStoreObj = getMainStoreObj;