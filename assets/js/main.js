
var tz;
var idTag = $('#idTag').val();
var connectorId = $('#connectorId').val();
var meterStart = $('#meterStart').val();
var reservationId = $('#reservationId').val();
var meterStop = $('#meterStop').val();
var transactionData = $('#transactionData').val();
var chargePointVendor = $('#chargePointVendor').val();
var chargePointModel = $('#chargePointModel').val();
var chargePointSerialNumber = $('#chargePointSerialNumber').val();
var chargeBoxSerialNumber = $('#chargeBoxSerialNumber').val();
var firmwareVersion = $('#firmwareVersion').val();
var iccid = $('#iccid').val();
var imsi = $('#imsi').val();
var meterType = $('#meterType').val();
var meterSerialNumber = $('#meterSerialNumber').val();
var datatrasfer = $('#datatrasfer').val();


// Eventlistener for autosave on blur
$("#configform input").each(function () {
    $(this)[0].onblur = saveSingleConfigValueCallback;
    try {
        loadSingleConfiguration($(this));
    }
    catch (e) { };
});

function onAction(action) {
    idTag = $('#idTag').val();
    connectorId = $('#connectorId').val();
    meterStart = $('#meterStart').val();
    reservationId = $('#reservationId').val();
    meterStop = $('#meterStop').val();
    transactionData = $('#transactionData').val();
    chargePointVendor = $('#chargePointVendor').val();
    chargePointModel = $('#chargePointModel').val();
    chargePointSerialNumber = $('#chargePointSerialNumber').val();
    chargeBoxSerialNumber = $('#chargeBoxSerialNumber').val();
    firmwareVersion = $('#firmwareVersion').val();
    iccid = $('#iccid').val();
    imsi = $('#imsi').val();
    meterType = $('#meterType').val();
    meterSerialNumber = $('#meterSerialNumber').val();
    datatrasfer = $('#datatrasfer').val();
    statusCode = $('#statusCode').val();
    errorCode = $('#errorCode').val();
}

const Action = {
    connect: ["CP", "endp"],
    authorize: ["idTag"],
    startTransaction: ["idTag", "meterStart", "connectorId"],
    stopTransaction: ["idTag", "meterStart", "TransToStp"],
    heartBeat: [],
    meterValues: ["meterValueUnit", "meterValue", "meterValueTransaction"],
    statusNotification: ["connectorId", "statusCode", "errorCode"],
    dataTransfer: ["datatrasfer"],
    bootNotification: ["chargePointVendor", "chargePointModel"] // "chargePointSerialNumber", "chargeBoxSerialNumber", "firmwareVersion", "iccid", "imsi", "meterType", "meterSerialNumber"]
};

function validateActionParameter(action) {
    if (action !== "connect" && !_websocket) {
        alert("not connected");
    }

    let allRequirementsFullfiled = true;
    Action[action].forEach(requirement => {
        if (!$('#' + requirement).val()) {
            $('#' + requirement)[0].style.borderColor = "red";

            allRequirementsFullfiled = false;
        } else {
            $('#' + requirement)[0].style.borderColor = "grey";
        }
    });

    if (!allRequirementsFullfiled) {
        alert("some values missing marked red");

        throw "not all required fileds filled";
    }
}

// init 
showTransactions()
// UI 
function showTransactions() {
    // clean displayed Transactions
    $('#transactions').html('');
    // show all Transactions. 
    try { //if (sessionStorage.getItem("transactionId") !== undefined) {}else{}
        let transactionMessages = JSON.parse(sessionStorage.getItem("transactionMessages"));
        for (var i = 0; i < transactionMessages.length; i++) {
            if (transactionMessages[i] == null) {
                continue;
            }
            $('#transactions').append(JSON.stringify(transactionMessages[i]) + "<br>");
        }

        // set latest TransactionId
        if (transactionMessages.length > 0) {
            $('#TransToStp').val(transactionMessages[transactionMessages.length - 1]["transactionId"]);
        }
    } catch (e) {
        $('#transactions').html('No transactions!');
    }
}

//UI + 
var step = 1;
$(document).ready(function () {
    setInterval(function () {
        tz = parseInt($('#timeZone').val());
        $('#time').html(new Date().toISOString())
    }
        , 1000);

    window.onmousemove = logMouseMove;

    function logMouseMove(e) {
        e = event || window.event;
        mousePos = { x: e.clientX, y: e.clientY };
        var w_width = $(window).width();
        var px;
        if ((w_width / 2) > e.clientX) {
            px = parseInt(((w_width / 2) - e.clientX) / 100);
            _px = parseInt(((w_width / 2) - e.clientX) / 60);
            $('#tesla').css('left', '' + parseInt(px + 210) + 'px');
            $('#charge_point').css('left', '' + parseInt(_px + 495) + 'px');

        } else {
            px = parseInt(((w_width / 2) - e.clientX) / 100);
            _px = parseInt(((w_width / 2) - e.clientX) / 60);
            $('#tesla').css('left', '' + parseInt(210 + px) + 'px');
            $('#charge_point').css('left', '' + parseInt(495 + _px) + 'px');
        }
    }

    $('#step2v1').hide();
    $('#step2v2').hide();
    $('#step3').hide();
    $('#back').hide();
    $('#sc').click(function () {
        $('#step1').hide();
        $('#step2v1').show();
        $('#back').show();
        step = 2;

    });
    $('#fc').click(function () {
        $('#step1').hide();
        $('#step2v2').show();
        $('#back').show();
        step = 2;
    });

    $('.step2').click(function () {
        $('#step2v1').hide();
        $('#step2v2').hide();
        $('#step3').show();
    });

    $('#back').click(function () {
        switch (step) {
            case 1:
                break;
            case 2:
                $('#step1').show();
                $('#step2v2').hide();
                $('#step2v1').hide();
                $('#step3').hide();
                $('#back').hide();
                break;
            case 3:
                $('#step1').show();
                $('#step2v2').hide();
                $('#step2v1').hide();
                $('#step3').hide();
                $('#back').hide();
                break;
            case 4:

                break;
            case 5:

                break;
            default:
                break;
        }

    });
});


$('.indicator').hide();
$('#red').show();
//UI -
var c = 0;

var connecting;

var start_id = "";
var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
var id = randonId();
var _websocket = null;

var connector_locked = false;

function randonId() {
    id = "";
    for (var i = 0; i < 36; i++) {
        id += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return id;
}

function wsConnect() {
    validateActionParameter("connect")

    let wsurl = $('#endp').val();
    let CP = $('#CP').val();


    if (_websocket) {
        $('#red').show();
        _websocket.close(3001);
    } else {
        _websocket = new WebSocket(wsurl + "" + CP, ["ocpp1.6", "ocpp1.5"]);
        _websocket.onopen = function (authorizationData) {
            sessionStorage.setItem('connecting', null);

            sessionStorage.setItem('LastAction', "BootNotification");
            $('#yellow').show();
            BootNotification();

            $('#connect').text('Disconnect').css('background', 'green');

        };

        _websocket.onmessage = function (msg) {
            c++;
            var ddata = (JSON.parse(msg.data));

            if (c == 1) {
                var hb_interval = handleData(ddata);
                sessionStorage.setItem("Confriguration", hb_interval);
                startHB(hb_interval * 1000);
            }

            if (ddata[0] === 3) {
                la = getLastAction();

                if (la == "startTransaction") {

                    let transactionMessage = ddata[2];
                    // let transactionId = transactionMessage["transactionId"];
                    let transactionMessages = []

                    try {
                        transactionMessages = JSON.parse(sessionStorage.getItem("transactionMessages"));
                    } catch (e) {
                        logMsg(e)
                    }
                    
                    if (! transactionMessages) {
                        transactionMessages = []
                    }

                    transactionMessages.push(transactionMessage);
                    sessionStorage.setItem("transactionMessages", JSON.stringify(transactionMessages));

                    $('#transactions').html('');

                    // write all active transactions to dom. 
                    showTransactions()
                }
                logMsg("Response recieved successfully!");
                logMsg(JSON.stringify(ddata));
            } else if ((JSON.parse(msg.data))[0] === 4) {
                logMsg("Data exchange failed - JSON is not accepted!");
            } else if ((JSON.parse(msg.data))[0] === 2) {
                logMsg((JSON.parse(msg.data))[2]);
                logMsg((msg.data));
                id = (JSON.parse(msg.data))[1];
                switch (ddata[2]) {
                    case "Reset":
                        //Reset type SOFT, HARD
                        var ResetS = JSON.stringify([3, id, { "status": "Accepted" }]);
                        _websocket.send(ResetS);
                        location.reload();
                        break;
                    case "RemoteStopTransaction":
                        //TransactionID
                        var remStp = JSON.stringify([3, id, { "status": "Accepted" }]);
                        _websocket.send(remStp);
                        var stop_id = (JSON.parse(msg.data)[3].transactionId);
                        stopTransaction(stop_id);
                        $('.indicator').hide();
                        $('#yellow').show();
                        break;
                    case "RemoteStartTransaction":
                        //Need idTag, connectorId (map - ddata[3])
                        var remStrt = JSON.stringify([3, id, { "status": "Accepted" }]);
                        _websocket.send(remStrt);
                        startTransaction();

                        break;
                    case "UnlockConnector":
                        //connectorId
                        var UC = JSON.stringify([3, id, { "status": "Unlocked" }]);
                        _websocket.send(UC);
                        break;
                    case "ChangeAvailability":
                        //connectorId
                        var CA = JSON.stringify([3, id, { "status": "Accepted" }]);
                        _websocket.send(CA);
                        break;
                    case "ChangeConfiguration":
                        //connectorId
                        var CC = JSON.stringify([3, id, { "status": "Accepted" }]);
                        _websocket.send(CC);
                        break;
                    case "ClearCache":
                        //connectorId
                        var CCache = JSON.stringify([3, id, { "status": "Accepted" }]);
                        _websocket.send(CCache);
                        break;
                    case "GetConfiguration":
                        //connectorId
                        var GC = JSON.stringify([3, id, {}]);
                        _websocket.send(GC);
                        break;
                    //17
                    default:
                        var error = JSON.stringify([4, id]);
                        _websocket.send(error);
                        break;
                }

            }


            // Получение данных из sessionStorage
            //var data = sessionStorage.getItem('key');
        };

        _websocket.onclose = function (evt) {
            $('#connect').text('Connect').css('background', '#369');
            if (evt.code == 3001) {
                logMsg('ws closed');
                _websocket = null;
            } else {
                logMsg('ws connection error: ' + evt.code);
                $('#console').html("");
                $('#connect').text('Connect').css('background', '#369');
                $('.indicator').hide();
                $('#red').show();
                _websocket = null;
                //wsConnect();
            }
            //
        };

        _websocket.onerror = function (evt) {
            if (_websocket.readyState == 1) {
                $('#red').show();
                logMsg('ws normal error: ' + evt.type);
            }
        };
    }
}

function logMsg(err) {
    console.log(err);
    $('#console').append('<li>' + err + '</li>');
}

function Authorize() {
    validateActionParameter("authorize");
    sessionStorage.setItem('LastAction', "Authorize");
    var Auth = JSON.stringify([2, id, "Authorize", { "idTag": idTag }]);
    _websocket.send(Auth);

}

function startTransaction() {
    onAction();
    validateActionParameter("startTransaction");

    sessionStorage.setItem('LastAction', "startTransaction");
    $('.indicator').hide();
    $('#green').show();
    connector_locked = true;
    logMsg("Connector status changed to: " + connector_locked);
    var strtT = JSON.stringify([2, id, "StartTransaction", {
        "connectorId": parseInt(connectorId),
        "idTag": idTag,
        "timestamp": new Date().toISOString(),
        "meterStart": parseInt(meterStart),
    }]);
    _websocket.send(strtT);
}

function stopTransaction(transaction_id = false) {
    onAction();
    validateActionParameter("stopTransaction");

    sessionStorage.setItem('LastAction', "stopTransaction");
    transaction_id == false ? ssid = sessionStorage.getItem("transactionId") : ssid = transaction_id;
    $('.indicator').hide();
    connector_locked = false;
    logMsg("Connector status changed to: " + connector_locked);
    $('#yellow').show();
    if ((transaction_id === false) && ($('#TransToStp').val() != '')) {
        ssid = $('#TransToStp').val();
    }
    var stpT = JSON.stringify([2, id, "StopTransaction", {
        "transactionId": parseInt(ssid),
        "idTag": idTag,
        "timestamp": new Date().toISOString(),
        "meterStop": parseInt(meterStop)
    }]);
    let transactionMessages = JSON.parse(sessionStorage.getItem("transactionMessages"));
    let rmIndex = transactionMessages.findIndex(element => { return element["transactionId"] === parseInt(ssid) });
    // removes one elment at rmIndex
    transactionMessages.splice(rmIndex, 1);
    sessionStorage.setItem("transactionMessages", JSON.stringify(transactionMessages));

    showTransactions()

    _websocket.send(stpT);
}

// Session vs Local Storage 
// https://stackoverflow.com/a/5523174
function saveSingleConfigValueCallback(event) {
    id = event.target.id;
    localStorage.setItem(id, event.target.value);
}

function loadSingleConfiguration(ele) {
    // ele := jqery object
    ele.val(localStorage.getItem(ele.attr("id")));
}

function handleData(data, request = false) {
    var lastAction = getLastAction();
    if (lastAction = "BootNotification") {
        data = data[2];
        heartbeat_interval = data.interval;
        return heartbeat_interval;
    } else if (lastAction = "StartTransaction") {
        return "StartTransaction";
    } else if (1 == 2) {
        alert("else");
    }

}

function getLastAction() {
    var LastAction = sessionStorage.getItem("LastAction");
    return LastAction;
}

function BootNotification() {
    onAction();
    validateActionParameter("bootNotification");

    var BN = JSON.stringify([2, id, "BootNotification", {
        "chargePointVendor": chargePointVendor,
        "chargePointModel": chargePointModel,
        "chargePointSerialNumber": chargePointSerialNumber,
        "chargeBoxSerialNumber": chargeBoxSerialNumber,
        "firmwareVersion": firmwareVersion,
        "iccid": iccid,
        "imsi": imsi,
        "meterType": meterType,
        "meterSerialNumber": meterSerialNumber
    }]);

    logMsg('ws connected');

    _websocket.send(BN);
}

function startHB(interval) {
    setInterval(send_heartbeat, interval);
}

function send_heartbeat() {
    sessionStorage.setItem('LastAction', "Heartbeat");
    var HB = JSON.stringify([2, id, "Heartbeat", {}]);
    _websocket.send(HB);
}

function getConnecting() {
    return sessionStorage.getItem('connecting');
}

//bind controls
$('#connect').click(function () {

    onAction();

    $('.indicator').hide();
    //alert(_websocket);
    if (_websocket == null) {
        sessionStorage.setItem('connecting', 'true');
    }


    showBlue();

    function showBlue() {
        connecting = getConnecting();
        if (connecting == 'true') {
            setTimeout(function () { $('#blue').show(); hideBlue() }, 500);
        }
    }

    function hideBlue() {
        connecting = getConnecting();
        setTimeout(function () { $('#blue').hide(); showBlue() }, 500);
    }


    $('#console').html("");
    wsConnect();
});

$('#send').click(function () {
    onAction();
    Authorize();
});

$('#start').click(function () {
    onAction();
    startTransaction();
});

$('#stop').click(function () {
    onAction();
    stopTransaction();
});

$('#mv').click(function () {
    onAction();
    validateActionParameter("meterValues");

    sessionStorage.setItem('LastAction', "MeterValues");
    var MV = JSON.stringify([2, id, "MeterValues", {
        "connectorId": 1,
        "meterValue": [
            {
                "sampledValue": [
                    {
                        "unit": $('#meterValueUnit').val(),
                        "value": $('#meterValue').val(),
                    },
                ],
                "timestamp": new Date(),
            },
        ],
        "transactionId": Number.parseInt($('#meterValueTransaction').val()),
    }]);
    _websocket.send(MV);

});
$('#heartbeat').click(function () {
    send_heartbeat();
});

$('#status').click(function () {
    onAction();
    validateActionParameter("statusNotification")

    sessionStorage.setItem('LastAction', "StatusNotification");
    var SN = JSON.stringify([2, id, "StatusNotification", {
        "connectorId": connectorId,
        "status": statusCode,
        "errorCode": errorCode,
        "info": "",
        "timestamp": new Date().toISOString(),
        "vendorId": "",
        "vendorErrorCode": ""
    }]);
    _websocket.send(SN);

});

$('#data_transfer').click(function () {
    onAction();
    validateActionParameter("dataTransfer")

    datatrasfer = $('#datatrasfer').val();
    sessionStorage.setItem('LastAction', "DataTransfer");
    var DT = JSON.stringify([2, id, "DataTransfer", {
        "vendorId": "rus.avt.cp",
        "messageId": "1",
        "data": datatrasfer
    }]);
    logMsg(DT);
    _websocket.send(DT);

});

$('#boot_notification').click( function () {
    BootNotification();
});

$('#connect').on('change', function () {
    onAction();
    if (_websocket) {
        _websocket.close(3001);

    }
});

