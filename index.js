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

////
var mainWindowListMap = new Map();




var mainDispatcher = {
    init: function init(mainIpc) {
        ipcMain = mainIpc;
        ipcMain.on('updateStore', function (event, dataName, data) {
            //console.log("mainDispatcher 실행", dataName, data);
            if (mainStoreObj[dataName] !== data) {
                mainProcess.changeData(dataName, data);
            }
        });
    }
};

var mainWindowCRUD = {
    init: function init(mainIpc, BrowserWindow) {
        ipcMain = mainIpc;

        ipcMain.on('createNewWindow', function (event, newWindowName, informationDataObj, htmlFileUrl) {
            console.log("createNewWindow 실행", newWindowName, informationDataObj, htmlFileUrl);
            var newBrowser = new BrowserWindow({width: informationDataObj.width, height: informationDataObj.height, frameless:true});

            newBrowser.on('closed', () => {
                console.log('window closed event receive');
            mainProcess.removeWindow(newWindowName);
            newBrowser = null;
        })

            newBrowser.loadURL(htmlFileUrl);
            mainProcess.addWindow(newWindowName, newBrowser);

        });

        ipcMain.on('closeWindow', function (event, windowNameToClose) {
            console.log("windowNameToClose 실행", windowNameToClose);

            //일단 종료시킬 윈도우를 맵에서 가져오고
            var browser = mainWindowListMap.get(windowNameToClose);

            //윈도우 리스트 저장맵에서 삭제시켜준후
            mainProcess.removeWindow(windowNameToClose);

            //윈도우 종료.
            browser.close();
        });

    }
};


var rendererAction = {
    init: function init(remdererIpc) {
        ipcRenderer = remdererIpc;
    },
    updateStore: function updateStore(dataName, data) {
        //console.log("rendereAction - updateStore", dataName, data);
        ipcRenderer.send('updateStore', dataName, data);
    },

    createNewWindow: function createNewWindow(newWindowName, informationDataObj, htmlFileUrl) {
        console.log('createNewWindow 실행');
        ipcRenderer.send('createNewWindow', newWindowName, informationDataObj, htmlFileUrl);
    },

    closeWindow: function closeWindow(windowNameToClose) {
        console.log('closeWindow 실행');
        ipcRenderer.send('closeWindow', windowNameToClose);
    }


};

var mainProcess = {
    /////
    init: function init(store, windowListMap) {
        mainStoreObj = store;
        mainWindowListMap = windowListMap;
    },



    //////
    addWindow : function addWindow(key, windowObj){
        mainWindowListMap.set(key, windowObj);
    },


    //////
    removeWindow: function removeWindow(key) {
        mainWindowListMap.delete(key);
    },



    changeData: function changData(dataName, newData){
        //console.log('electron_flux - changeData excute', dataName, newData);
        mainStoreObj[dataName] = newData;
        mainWindowListMap.forEach(function (currentValue, key) {
            //console.log('electron_flux - changeData ForEach execute',  key, currentValue);
            currentValue.webContents.send('dataChanged', dataName);
        });
    }


};

var rendererProcess = {


    init: function init(rendererRemoteMain, rendererIpc) {
        main = rendererRemoteMain;
        ipcRenderer = rendererIpc;
        mainStoreObj = main.getStore();
        mainWindowListMap = main.getWindowListMap();
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


function getMainWindowListMap() {
    return mainWindowListMap;
}

exports.mainDispatcher = mainDispatcher;
exports.rendererAction = rendererAction;
exports.mainProcess = mainProcess;
exports.rendererProcess = rendererProcess;
exports.mainWindowCRUD = mainWindowCRUD;
exports.getMainStoreObj = getMainStoreObj;
exports.getMainWindowListMap = getMainWindowListMap;