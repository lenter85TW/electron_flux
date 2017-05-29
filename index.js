/**
 * Created by kimdoeun on 2017. 3. 16..
 */

var EventEmitter = require('events').EventEmitter;

var ipcMain = null;
var ipcRenderer = null;
var remote = null;
var windowList = [];
var main222 = null;
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

        ipcMain.on('createNewWindow', function (event, newWindowName, browserOptionsObj, htmlFileUrl, forceOpenWindowAndReplaceItBoolean=false) {
            console.log("createNewWindow 실행", newWindowName, browserOptionsObj, htmlFileUrl, forceOpenWindowAndReplaceItBoolean);

            //이미 해당 이름으로 윈도우가 열려있지 않다면
            if(mainWindowListMap.get(newWindowName) == null) {
                console.log('new window create');
                //새로운 윈도우 생성하고 열자
                var newBrowser = new BrowserWindow(browserOptionsObj);

                newBrowser.on('closed', () => {
                    console.log('window closed event receive');
                    mainProcess.removeWindow(newWindowName);
                    newBrowser = null;
                })

                newBrowser.loadURL(htmlFileUrl);
                mainProcess.addWindow(newWindowName, newBrowser);

                //이미 해당 이름으로 윈도우가 열려 있는 상태라면
            } else {
                //똑같은 이름으로 새로운 윈도우 브라우저로 대체하고 싶다면
                if(forceOpenWindowAndReplaceItBoolean === true){
                    //일단 종료시킬 윈도우를 맵에서 가져오고
                    var browser = mainWindowListMap.get(newWindowName);
                    if(browser != null){
                        //윈도우 리스트 저장맵에서 삭제시켜준후
                        mainProcess.removeWindow(newWindowName);
                        //윈도우 종료.
                        browser.close();
                    }

                    console.log('new window replace old window');
                    //새로 다시 윈도우 만들고 windowListMap에 추가해주고 윈도우도 열자.
                    var newBrowser = new BrowserWindow(browserOptionsObj);

                    newBrowser.on('closed', () => {
                        console.log('replaced window closed event receive');
                        mainProcess.removeWindow(newWindowName);
                        newBrowser = null;
                    })

                    newBrowser.loadURL(htmlFileUrl);
                    mainProcess.addWindow(newWindowName, newBrowser);


                } else {
                    console.log('nothing happened')
                    // 아무 일도 안한다.
                }
            }

        });

        ipcMain.on('closeWindow', function (event, windowNameToClose, callBackFunctionBeforeWindowClosed, callBackFunctionAfterWindowClosed) {
            console.log("windowNameToClose 실행", windowNameToClose);

            //일단 종료시킬 윈도우를 맵에서 가져오고
            var browser = mainWindowListMap.get(windowNameToClose);
            if(browser != null){
                if(callBackFunctionBeforeWindowClosed !== null){
                    callBackFunctionBeforeWindowClosed();
                }


                //윈도우 리스트 저장맵에서 삭제시켜준후
                mainProcess.removeWindow(windowNameToClose);

                //윈도우 종료.
                browser.close();

                if(callBackFunctionAfterWindowClosed !== null){
                    callBackFunctionAfterWindowClosed();
                }

            }


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

    createNewWindow: function createNewWindow(newWindowName, browserOptionsObj, htmlFileUrl, forceOpenWindowAndReplaceItBoolean) {
        console.log('createNewWindow 실행');
        ipcRenderer.send('createNewWindow', newWindowName, browserOptionsObj, htmlFileUrl, forceOpenWindowAndReplaceItBoolean);
    },

    closeWindow: function closeWindow(windowNameToClose, callBackFunctionBeforeWindowClosed, callBackFunctionAfterWindowClosed) {
        console.log('closeWindow 실행');
        ipcRenderer.send('closeWindow', windowNameToClose, callBackFunctionBeforeWindowClosed, callBackFunctionAfterWindowClosed);
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


    init: function init(rendererIpc, remote) {
        ipcRenderer = rendererIpc;
        mainStoreObj = remote.getGlobal('storeObj');
        mainWindowListMap = remote.getGlobal('mainWindowListMap');
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
    //var mainStoreObj = ipcRenderer.sendSync('getStore')

    return mainStoreObj;
}


function getMainWindowListMap() {
    //var mainWindowListMap = ipcRenderer.sendSync('getWindowListMap')

    return mainWindowListMap;
}

exports.mainDispatcher = mainDispatcher;
exports.rendererAction = rendererAction;
exports.mainProcess = mainProcess;
exports.rendererProcess = rendererProcess;
exports.mainWindowCRUD = mainWindowCRUD;
exports.getMainStoreObj = getMainStoreObj;
exports.getMainWindowListMap = getMainWindowListMap;