// /**
//  * Получаем полный URL страницы, содержащей html модального окна
//  */
// let modalURL = browser.extension.getURL("templates/modal.html");
// let formLoaded = false;
// /**
//  * Создаем промис, отслеживающий факт вставки модального окна в страницу
//  * @type {Promise<any>}
//  */
// let promise = new Promise(function (resolve, reject) {
//     jQuery.get(modalURL, function (data) {
//         if (data.length > 0) {
//             resolve(data);
//         }
//         else {
//             reject("error");
//         }
//
//
//     });
//
//
// });
// promise.then((formHTML) => {
//
//     if (formHTML.length > 0) {
//
//         jQuery('body').append(formHTML);
//         formLoaded = true;
//     }
//     alert("TEST!!!!");
//     jQuery("#launchModal").modal('show');
//
//
// }).catch((error) => {
//     throw "Ошибка: Модальное окно не было загружено!";
// });
// /**
//  * Обработчик клика по кнопки popup'a (показываем модальное окно)
//  */

let modal = `
<style>
    .fade {
        opacity: 1 !important;
    }
    .modal-backdrop {
        background-color: rgba(0, 0, 0, 0.5) !important;
    }

    .row .btn {
        margin: 2px;
    }
    .modal-dialog {
        top: 25%;
    }
    #reportModal .modal-dialog {
        width: 100%;
        max-width: none;
    }
    h4.hint {
        color: #2db3b3;
        display: block;
        bottom: 45px!important;
        background: white!important;
    }
    .action-meta {
        min-height: 14px;
        background-color: white!important;
        
    }
    #launchBtn {
        margin-top: 6px!important;
    }
    .btn {
        font-size: 13px!important;
        line-height: 14px!important;
    }
    .modal-dialog {
        background: white!important;
    }
    h4.hint::before {
        border-top: none;
    }
   .modal .modal-body {    
    overflow-y: auto;
    max-height: 600px;
  }
   .ng-isolate-scope .modal-body, .modal-dialog {
    max-width: none!important;
   }
   
  .procedure {
  font-size: 9px!important;
  }
</style>
<div id="launchModal" class="modal fade">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title text-center">Аналитика</h4>
                <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
            </div>
            <div class="modal-body">
                <div class="container">
                    <div class="row">
                        <button class="btn btn-default btn-action" data-action="DangerZones"> Превышение сроков записи
                        </button>
                        <button class="btn btn-default btn-action" data-action="Repetitive"> Повторяющиеся пациенты
                        </button>
                        <button class="btn btn-default btn-action" data-action="RecordSources"> Проверка источников
                            записи
                        </button>
                    </div>
                </div>
                <div class="container action-content ">
                    <hr>
                    <h4 class="text-center">Выбранные ресурсы: </h4>
                    <hr>
                    <div class="currentResources" class="row">

                    </div>
                    <div class="action-meta" class="row">
                    </div>
                    <div id="settings" class="input-group mb-3"></div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">Закрыть</button>
            </div>
        </div>
    </div>
</div>
<div id="reportModal" class="modal fade">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title text-center">Отчет</h4>
                <button id="selectReport" class="btn btn-success" > Выделить все</button>
                <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
            </div>
            <div class="modal-body">
                <table id="reportContent" class="table table-bordered">
                </table>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">Закрыть</button>
            </div>
        </div>
    </div>
</div>
`;
jQuery('body').append(modal);
let formLoaded = true;

browser.runtime.onMessage.addListener((message) => {
    if (formLoaded === true) {
        jQuery("#launchModal").modal('hide');
        jQuery("#reportModal").modal('hide');
        jQuery(`#${message.id}`).modal('show');
        /**
         * Загружаем
         * Массив
         * Данных
         * по
         * записям
         */


    }
    else {
        console.log('Модальное окно еще не загружено!');
    }

});

/**
 * Обработка ошибок
 * @param message
 * @constructor
 */
function EmiasPlusError(message) {
    this.name = "EmiasPlusError";
    this.message = message;

    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
    } else {
        this.stack = (new Error()).stack;
    }

}

EmiasPlusError.prototype = Object.create(Error.prototype);
EmiasPlusError.prototype.constructor = EmiasPlusError;

function ActionError(action) {
    EmiasPlusError.call(this, "Не найдено действие " + action)
    this.name = "ActionError";

    this.action = action;
}

ActionError.prototype = Object.create(EmiasPlusError.prototype);
ActionError.prototype.constructor = ActionError;

function FillError(field) {
    EmiasPlusError.call(this, "Некорректно заполнено поле: " + field);
    this.name = "FillError";
    this.field = field;
}

FillError.prototype = Object.create(EmiasPlusError.prototype);
FillError.prototype.constructor = FillError;


/**
 * Получение данных по экшену
 * @param action
 * @returns {{start: {title: string, type: string, id: string, class: string, value: string}, endDate: {title: string, type: string, id: string, class: string, value: string}, submit: {title: string, type: string, id: string, class: string, value: string}}|actionsData.Repetitive.input|{start, endDate, submit}|string|any|input}
 */
function getActionData(action) {

    if (action in actionsData) {
        return actionsData[action].input;
    }
    else {
        throw new ActionError(action);
    }
}

function getMeta(action) {
    let result = {};
    if (action in actionsData) {
        for (meta in actionsData[action]) {
            if (meta != "input" && meta != "output") {
                result[meta] = actionsData[action][meta];
            }
        }


    }
    else {
        throw new ActionError(action);
    }
    return result;
}

function metaCreate(fields) {
    let meta_tpl = `
       <h4 class="text-center __">__</h4>
    `;
    let result = "";
    // !!! альтернативный вариант - переводить объект в массив по-другому: типа item: test ----> [0] => [item, test]
    for (field in fields) {

        result += meta_tpl;
    }
    fields = PrepareObjectToBind(fields);

    return ParamsBind(result, fields);

}

/**
 * Функция связки шаблонов и значений ( аналог %s для массива строк)
 * @param needle
 * @param string
 * @param values
 * @returns {*}
 */
function ParamsBind(template, values, needle) {
    if (!Array.isArray(values)) {
        console.log("Не удалось сформировать строку");
        return;
    }
    needle === undefined ? needle = "__" : needle;

    values.forEach(function (item) {
        template = template.replace(needle, item);
    });

    return template;

}

/**
 * Функция перевода объекта в массив для связывания параметров
 * @param obj
 * @param onlyVal
 * @returns {Array}
 * @constructor
 */
function PrepareObjectToBind(obj, onlyVal) {
    if (onlyVal === undefined) {
        onlyVal = false;
    }
    let fields_arr = [];
    for (field in obj) {
        onlyVal === false ? fields_arr.push(field) : true;
        fields_arr.push(obj[field]);
    }
    return fields_arr;
}

/**
 * Функция подготовки заголовков таблицы
 * @param fields
 * @returns {*}
 */
function tableHeaders(action) {
    let fields = actionsData[action].output.table_headers;
    let head_tpl = `
        <thead>
            <tr>
    `;
    for (let i = 0; i < fields.length; i++) {
        head_tpl += `<th scope="col">__</th>
        `;
    }
    head_tpl += `
            </tr>
        </thead>
    `;
    let headHTML = ParamsBind(head_tpl, fields);
    return headHTML;
}

/**
 * Шаблон поля ввода
 * @param fields - object
 */
function inputCreate(fields) { //fields
    let input_tpl = `
                <input placeholder="__" type="__" id="__" class="__" value="__">
                    `;
    let result = "";


    for (name in fields) {
        let fields_arr = PrepareObjectToBind(fields[name], true);
        result += ParamsBind(input_tpl, fields_arr);
    }
    return result;

}

/**
 * Функция подготовки отчета
 * data - массив объектов
 * @param action
 * @param data
 * @returns {string}
 */
function reportCreate(action, data) {
    let report_tpl = actionsData[action].output.item_tpl;
    let result = "";


    data.forEach(function (item, data) {
        let fields_arr = PrepareObjectToBind(item, true);
        result += ParamsBind(report_tpl, fields_arr);
    });
    return result;

}

/**
 * Функция валидации полей
 * @param action
 * @param data
 * @returns {boolean}
 */
function fieldsValidate(action) {
    let fields = actionsData[action].input;
    let result;
    for (key in fields) {

        let value = jQuery(`#${key}`).val();

        let type = fields[key].type;
        switch (type) {
            case "date":
                result = checkDate(value);
        }
        if (result === false) {
            throw new FillError(fields[key].title);
        }
    }
    return true;
}


function checkDate(val, delimiter) {
    if (delimiter === undefined) {
        delimiter = ".";
    }
    if (typeof val != "string") {
        return false;
    }
    let date;
    let error = 0;
    let split = val.split(delimiter);
    if (Array.isArray(split)) {
        if (split.length === 3) {
            date = new Date(split[0], split[1], split[2]);

        }

    }
    if (date instanceof Date) {
        return true;
    }
    else {
        return false;
    }

}

/*
* Функция нахождения данных по указанной специальности
* Принимает на вход наименование специализации
 */


let findSpecData = (specName) => {
    let currentLevel;
    for (specLevel in specTypes) {
        specTypes[specLevel].specList.forEach(function (currentSpec, specTypes) {
            if (currentSpec == specName) {
                currentLevel = specLevel;
            }
        });
    }
    return specTypes[currentLevel];


}
/**
 * Функция, вычисляющая разницу дат
 * Принимает два параметра: 1 - Из какой даты вычитаем, 2 - какую вычитаем
 */
let emias_dateDiff = (emias_firstDate, emias_secondDate) => { //вид даты дд.мм.гггг
    let emias_firstDay = Number(emias_firstDate.substring(0, 2));
    let emias_firstMonth = Number(emias_firstDate.substring(3, 5)) - 1; //js считает от нуля
    let emias_firstYear = Number(emias_firstDate.substring(6, 10));


    let emias_secondDay = Number(emias_secondDate.substring(0, 2));
    let emias_secondMonth = Number(emias_secondDate.substring(3, 5)) - 1;
    let emias_secondYear = Number(emias_secondDate.substring(6, 10));

    let emias_firstToDate = new Date(emias_firstYear, emias_firstMonth, emias_firstDay);
    let emias_secondToDate = new Date(emias_secondYear, emias_secondMonth, emias_secondDay);
    return ((emias_firstToDate.getTime() - emias_secondToDate.getTime()) / (3600 * 1000 * 24));
}

/**
 * Функция получает данные по записям по ресурсу в рамках указанного периода
 * Принимает ID ресурса, начальную и конечную даты
 * ID получаем по data-атрибуту "data-ar-id", берем из любого талона в списке; селектор: ".rir-schedule-column__content-item"
 */
let emiasGetAppointments = (resourceID, startDate, endDate, params) => {
    if (params === undefined) {
        params = {};
    }
    if (params.actual === undefined) {

        params.actual = true;
    }
    if (params.onlyCoWorkers === undefined) {
        params.onlyCoWorkers = true;
    }
    let result;
    let request_data = [
        {
            resourceId: resourceID, //ex: 14359553			
            startDateFrom: startDate,// ex: 2018-03-13"
            startDateTo: endDate // ex: 2018-03-13"
        }
    ];

    jQuery.ajax({
        type: "POST",
        url: ajaxAppUrl,
        data: JSON.stringify({request: request_data}),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        async: false,
        success: function (answer) {
            result = answer.response[0].appointments;
            if (params.actual === true) {

                result = removeCanceledAppointments(result);
                //console.log(result); //НЕФОРМАТИРОВАННЫЙ ВЫВОД ЗАПИСЕЙ

            }
            result = ExtractFields(result);
        }

    });

    return result;


}

/**
 * Функция удаления из выдачи записей, которые были отменены
 * На вход - массив записей
 */
let removeCanceledAppointments = (appointmentsArray) => {
    let result = [];
    appointmentsArray.forEach(function (item, i, appointmentsArray) {
        let output = false;
        if ('canceledReason' in item) {
            if (item.canceledReason.actuality === false) {
                output = true;
            }
        }
        else {
            output = true;
        }
        if (output === true) {
            result[result.length] = item;
        }
    });

    return result;
}
/**
 * Функция поиска записей, совершенных с превышением сроков ожидания
 * Принимает начальну и конечную даты в формате дд.мм.гггг
 */
let emiasParseData = (start, end) => {
    let resources = getResourcesId();
    start = start.split('.').reverse().join('-');
    end = end.split('.').reverse().join('-');
    let appointmentsData = [];
    resources.forEach(function (item, resources) {
        let data = emiasGetAppointments(item, start, end);
        data.forEach(function (row, data) {
            appointmentsData.push(row);
        });

    });

    //  11321434
    return appointmentsData;
    //console.log(appointmentsData.length);
    //dangerZoneOutput(appointmentsData);


}
/**
 * Функция получения id всех ресурсов
 */
let getResourcesId = () => {
    let idArr = [];

    jQuery('.rir-schedule-group__item').each(function () {
        let find = 0;
        let thisId = Number(jQuery(this).attr('data-ar-id'));
        if (thisId == 0) {
            return;
        }
        idArr.forEach(function (item, idArr) {
            if (item == thisId) {
                find++;
            }

        });
        if (find == 0) {
            idArr.push(thisId);
        }

    });
    return idArr;

}

/**
 * Функция, которая получает необходимые поля записи
 * На вход - запись и поля
 */
let GetAppointmentFields = (appointment, fields) => {
    if (fields === undefined) {
        fields = baseAppointmentFields;

    }
    let result = {};
    let recordDistance;
    let specData = {};
    fields.forEach(function (field, fields) {
        result[field] = GetFieldData(appointment, field);
    });


    if ('createTime' in result) {
        if (result.recordType == "RECEPTION") {
            specData = findSpecData(result.resourceSpeciality);
            result.specLevel = specData.alias;
        }
        else {
            specData.levelName = "procedures";
            result.specLevel = specTypes[specData.levelName].alias;
        }
        if (result.createTime != "Не указан") {
            if (result.createTime.date.length * result.startDateRecord.date.length > 0) {
                result.recordDistance = Number(emias_dateDiff(result.startDateRecord.date, result.createTime.date));
                result.zone = recordZone(result.recordDistance, specData.levelName);

            }

        }


    }


    return result;


}


/**
 * Функция, которая получает данные конкретного поля
 * На вход - запись и наименование поля
 * Возвращает строку, содержащую контент поля(полей)
 */
let GetFieldData = (appointment, fieldName) => {
    // Получаем пути к полям в формате field1.field2. ... 
    let fields = baseAppointmentFieldsData[fieldName].field_name;
    let type = baseAppointmentFieldsData[fieldName].type;
    let data;
    // Если нужно собрать строку из массива полей
    if (Array.isArray(fields)) {
        let content_arr = [];

        fields.forEach(function (field, fields) {
            if (FieldContentByPath(appointment, field) != "Не указан") {
                content_arr[content_arr.length] = FieldContentByPath(appointment, field);
            }
            else {
                return;
            }

        });
        if (fields.length == content_arr.length) {

            data = content_arr;
        }
        else {
            data = "Не указан";
        }


    }
    else {
        data = FieldContentByPath(appointment, fields);
    }
    if (data != "Не указан") {


        switch (type) {
            case "array":
                data = data.join(' ');
                break;
            case "integer":
                data = Number(data);
                break;
            case "date":
                data = ExportDateFromUnix(data);
                break;
            case "phone":
                data = formatPhoneNumber(data);
                break;

        }
    }
    return data;

}
/**
 * Функция, которая строит путь до необходимого поля по маске field1.field2.
 * На вход - запись и путь
 */
let FieldContentByPath = (appointment, fieldWay) => {
    let fieldAttachment = fieldWay.split('.');
    let fieldContent = appointment;

    fieldAttachment.forEach(function (field, fieldAttachment) {
        if (field in fieldContent) {
            fieldContent = fieldContent[field];
        }

    });
    if (typeof fieldContent == "object") {
        fieldContent = "Не указан";
    }
    return fieldContent;


}

/**
 * Функция добавления ведущего нуля
 */
function addZero(emias_number) {
    if (emias_number < 10) {
        emias_number = '0' + emias_number;
    }
    return emias_number;
}

/**
 * Функция перевода даты из UNIX-метки в стадартный вид
 */
let ExportDateFromUnix = (unixDate) => {
    let date = new Date(unixDate);
    let timeResult = {};
    timeResult.hours = addZero(date.getHours());
    timeResult.minutes = addZero(date.getMinutes());
    timeResult.seconds = addZero(date.getSeconds());
    timeResult.day = addZero(date.getDate());
    timeResult.month = addZero(date.getMonth() + 1);
    timeResult.year = addZero(date.getFullYear());
    timeResult.fullDate = timeResult.day + '.' + timeResult.month + '.' + timeResult.year + ' ' + timeResult.hours + ':' + timeResult.minutes;
    timeResult.date = timeResult.fullDate.split(' ')[0];
    timeResult.time = timeResult.fullDate.split(' ')[1];


    return timeResult;

}
/**
 * Функция коррекции формата номера телефона
 */
let formatPhoneNumber = (phone) => {
    if (Number(phone) > 0) {
        phone = "" + phone;
        let cityCode = phone.substring(0, 3);
        let num3 = phone.substring(3, 6);
        let num2 = phone.substring(6, 8);
        let num22 = phone.substring(8, 10);
        phone = '+7 (' + cityCode + ') ' + num3 + '-' + num2 + '-' + num22;

    }
    else {
        phone = "Телефон не определен";
    }


    return phone;


}

/**
 * Функция извлечения необходимых полей из записи
 */
let ExtractFields = (appointments) => {
    let preparedResult = [];
    appointments.forEach(function (item, appointments) {
        preparedResult[preparedResult.length] = GetAppointmentFields(item);
    });
    return preparedResult;


}

let recordZone = (distance, specLevel) => {
    let zone;


    if (distance >= specTypes[specLevel].redZone) {
        zone = "red";
    }
    else if (distance >= specTypes[specLevel].yellowZone) {
        zone = "yellow";
    }
    else {
        zone = "green"
    }

    return zone;

}
/**
 * Функция нахождения красных и желтых зон
 *
 */
let dangerZoneOutput = (appointments) => {
    let output = {
        yellow: [],
        red: []
    };
    appointments.forEach(function (appointment, appointments) {
        if ('zone' in appointment) {
            if (appointment.zone == 'yellow' || appointment.zone == 'red') {
                output[appointment.zone].push(appointment);
            }

        }
    });
    // Дописать вывод!
    console.log(output);
}

/*
* Функция поиска элемента в массиве
*/
function findMatches(needle, stack) {
    let result = false;
    stack.forEach(function (item) {
        item === needle ? result = true : result;
    });
    return result;

}

let repetitivePatients = (appointments) => {
    let output = [];
    let exclude = [];
    appointments.forEach(function (appointment, index, appointments) {
        let id = appointment.patientID;
        let compares_arr = [];
        if (!findMatches(id, exclude)) {

            appointments.forEach(function (compare_appointment, compare_index, compare_appointments) {
                let compare_id = compare_appointment.patientID;
                if (id == compare_id) {
                    compares_arr.push(compare_appointment);
                }

            });
            if (compares_arr.length > 1) {
                output.push(compares_arr);
                exclude.push(compares_arr[0].patientID);

            }

        }

    });
    if (output.length > 0) {
        return output;
    }
    else {
        console.log("Повторов не найдено!");
    }

    console.log(exclude);

}

function getNeededFields(action) {
    return actionsData[action].output.fields;
}

//emiasParseData();


/*
Определяем хост
*/
let getUrl = window.location;
let baseURL = getUrl.protocol;
let ajaxAppUrl = baseURL + "/registrator/appointmentappointment3/getAppointmentsByResource.api";
/**
 * Переменная, содержащая селекторы для манипуляций
 */
let emiasSelectors = {
    patientRegistry: ".rir-schedule-column__content-item"


}
/**
 * Переменная, которая хранит данные полей записи ( по умолчанию)
 * Из этой переменной можно формировать поля для получения
 * field_name  - наименование поля в рамках записи, указывать с учетом вложенности
 * type - тип самой записи, будет использоваться в форматирующей функции
 */
let baseAppointmentFieldsData = {
    patientFIO: {
        type: "array",
        field_name: [
            "patient.lastName",
            "patient.firstName",
            "patient.secondName"
        ],

    },
    patientID: {
        type: "integer",
        field_name: "patient.id"


    },
    policy: {
        type: "string",
        field_name: "patient.omsNumber"

    },
    startDateRecord: {
        type: "date",
        field_name: "startDate"
    },
    endDateRecord: {
        type: "date",
        field_name: "endDate"
    },
    resource: {
        type: "string",
        field_name: "availableResource.name",

    },
    resourceSpeciality: {
        type: "string",
        field_name: "availableResource.speciality.name",
    },
    phone: {
        type: "phone",
        field_name: "patient.phone"
    },
    senderEmployee: {
        type: "array",
        field_name: [
            "referral.senderMedicalEmployee.lastName",
            "referral.senderMedicalEmployee.l.firstName",
            "referral.senderMedicalEmployee.l.secondName"
        ],

    },
    senderSpeciality: {
        type: "string",
        field_name: "referral.senderMedicalEmployee.speciality.name"


    },
    senderLPU: {
        type: "string",
        field_name: "referral.senderMedicalEmployee.lpu.shortName"


    },
    createTime: {
        type: "date",
        field_name: "createTime"
    },
    recordSource: {
        type: "string",
        field_name: "appointmentAuthorInfo.externalSystemDesc"
    },
    resourceSpec: {
        type: "string",
        field_name: "availableResource.speciality.name"

    },
    recordType: {
        type: "string",
        field_name: "type"
    },
    procedure: {
        type: "string",
        field_name: "appointmentToLDP.ldpType.name"
    }


};
/**
 * Поля записи по умолчанию
 */
let baseAppointmentFields = [
    "patientFIO",
    "policy",
    "startDateRecord",
    "endDateRecord",
    "resource",
    "resourceSpeciality",
    "phone",
    "patientID",
    "senderEmployee",
    "senderSpeciality",
    "senderLPU",
    "createTime",
    "recordSource",
    "recordType",
    "procedure"

];

let specTypes = {
    therapy: {
        specList: [
            'Врач-терапевт участковый',
            'Врач-терапевт',
            'Врач общей практики (семейный врач)'
        ],
        alias: 'Терапия',
        yellowZone: 2,
        redZone: 4,
        levelName: "therapy"

    },
    firstLevel: {
        specList: [
            'Врач-оториноларинголог',
            'Врач-офтальмолог',
            'Врач-уролог',
            'Врач-хирург',
            'Врач-акушер-гинеколог',
        ],
        alias: 1,
        yellowZone: 6,
        redZone: 8,
        levelName: "firstLevel"

    },
    secondLevel: {
        specList: [
            "Врач-колопроктолог",
            "Врач-кардиолог",
            "Врач-невролог",
            "Врач-эндокринолог",
            "Врач-инфекционист",
            'Врач-аллерголог-иммунолог',
            'Врач-гастроэнтеролог',
            'Врач-гериатр',
            'Врач-нефролог',
            'Врач-пульмонолог',
            'Врач-ревматолог',
            'Врач-физиотерапевт',
            'Врач-онколог',
            'Врач-психиатр',
            'Врач-гематолог'


        ],
        alias: 2,
        yellowZone: 8,
        redZone: 11,
        levelName: "secondLevel"
    },
    procedures: {
        specList: [],
        alias: 'Процедуры',
        yellowZone: 8,
        redZone: 11,
        levelName: "procedures"

    }


};


let actionsData = {
    Repetitive: {
        hint: "Выберите период: ",
        input: {

            startDate: {
                title: "Начало поиска",
                type: "date",
                id: "startDate",
                class: "form-control",
                value: ""
            },
            endDate: {
                title: "Конец поиска",
                type: "date",
                id: "endDate",
                class: "form-control",
                value: ""
            },

            submit: {
                title: "",
                type: "submit",
                id: "Repetitive",
                class: "btn btn-default createReport",
                value: "Сформировать отчет"

            }
        },
        output: {
            item_tpl: `
                <tr>
                    <td>__</td>
                    <td>__</td>
                    <td>__</td>
                    <td>__</td>
                    <td>__</td>
                    <td>__</td>
                    <td>__</td>
                    <td class="procedure">__</td>
                </tr>
            `,
            fields: ["patientFIO", "policy", "phone", "startDateRecord", "recordSource", "createTime", "procedure"],
            table_headers: ["#", "ФИО", "Полис", "Телефон", 'Талон', 'Источник', 'Создание', "Процедура"]

        }
    },

};

/**
 * Функция обьединения массива выборки по названию полей
 * @param array
 * @param fields
 * @returns {{}}
 */

function joinFields(array, fields) {
    if (fields === undefined) {
        fields = [
            "startDateRecord",
            "recordSource",
            "createTime",
            "procedure"
        ];
    }
    console.log('array');
    console.log(array);
    let result = {
        id: "",
        patientFIO: "",
        policy: "",
        phone: "",
        startDateRecord: "",
        recordSource: "",
        createTime: "",
        procedure: ""
    };
    if (Array.isArray(array)) {
        //result = array[0];

        for (field in result) {

            if (fields.indexOf(field) != -1 && array.length > 1) {
                console.log('Основное условие прошло');
                for (let i = 0; i < array.length; i++) {
                    (result[field].length > 0) ? result[field] += "<br>" : result[field];
                    if ((field == "startDateRecord" || field == "endDateRecord" || field == "createTime") && (typeof array[i][field] == "object")) {
                        result[field] += array[i][field].fullDate;
                    }
                    else {
                        result[field] += array[i][field];
                        console.log('field = ' + field + ' fieldType = ' + typeof array[i][field] + ' ) ');
                    }

                }
            }
            else {
                result[field] = array[0][field];
            }

        }

    }
    else {
        result = array;
    }
    return result;

}

jQuery.fn.selectText = function () {
    let doc = document;
    let element = this[0];
    console.log(this, element);
    if (doc.body.createTextRange) {
        let range = document.body.createTextRange();
        range.moveToElementText(element);
        range.select();
    } else if (window.getSelection) {
        let selection = window.getSelection();
        let range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
    }
};

// let testArr = [
//
//     {a: 1, b: 1, c: 1},
//     {a: 1, b: 1, c: 1},
//     {a: 1, b: 1, c: 1},
// ];
// console.log(joinFields(testArr, ['a', 'b']));
let currentData = [];
//console.log(tableHeaders(actionsData.Repetitive.output.table_headers));
jQuery('body').on('click', '.btn-action', function () {
    jQuery('.btn-action').attr("class", "btn btn-default btn-action");

    let action = jQuery(this).attr('data-action');
    let data;
    let settingsHTML;
    let meta;
    let metaHTML;
    try {
        data = getActionData(action);
        meta = getMeta(action);
        jQuery(this).attr("class", "btn btn-info btn-action");
    }
    catch (err) {
        if (err instanceof ActionError) {
            alert(err.message);
        }
    }
    settingsHTML = inputCreate(data);
    metaHTML = metaCreate(meta);


    jQuery('.action-meta').html(metaHTML);
    jQuery('#settings').html(settingsHTML);
    jQuery('#startDate, #endDate').daterangepicker({singleDatePicker: true, locale: {format: 'DD.MM.YYYY'}});

});

jQuery('body').on('click', '.createReport', function () {


    let action = jQuery(this).attr('id');
    let html = tableHeaders(action);
    let repData = [];
    try {

        if (fieldsValidate(action)) {
            let start = jQuery('body').find('#startDate').val();
            let end = jQuery('body').find('#endDate').val();

            let appointmentsData = emiasParseData(start, end);


            let neededFields = getNeededFields(action);

            let id = 1;
            switch (action) {
                case "Repetitive":
                    currentData = repetitivePatients(appointmentsData);
            }
            // console.log('CURRENT DATA: ');
            // console.log(currentData);
            if (Array.isArray(currentData)) {
                currentData.forEach(function (row, currentData) {
                    if (row.length == 0) {
                        return;
                    }
                    // console.log('ROW');
                    // console.log(row);
                    let newRow = {};
                    newRow.id = id;

                    let preparedRow = joinFields(row);
                    console.log('PREPARED');
                    console.log(preparedRow);

                    neededFields.forEach(function (field, neededFields) {

                        newRow[field] = preparedRow[field];
                    });
                    // console.log('NEW ROW')
                    // console.log(newRow);
                    id++;
                    repData.push(newRow);
                });
            }
            // console.log('REP DATA');
            // console.log(repData);
            let report = reportCreate(action, repData);
            html += report;
            jQuery('#reportContent').html(html);
            jQuery("#launchModal").modal('hide');
            jQuery("#reportModal").modal('show');
        }
    }
    catch (err) {
        if (err instanceof FillError) {
            alert(err.message);
        }
    }


});
// jQuery('.main-menu').append("<button id='launchBtn' class='btn btn-info'>Аналитика</button>");
jQuery('body').on('click', '#launchBtn', function () {
    jQuery("#launchModal").modal('show');
    return false;

});
let interval = setInterval(function () {
    let test = jQuery('body').find('#launchBtn');
    if (test.length == 0) {
        console.log(1);
        jQuery('.main-menu').append("<button id='launchBtn' class='btn btn-default'>Аналитика</button>");
        //jQuery('.home-logo__default').append("<button id='launchBtn' class='btn btn-info'>Аналитика</button>");
    }

}, 1000);

jQuery('body').on('click', '#selectReport', function () {

    jQuery('#reportContent').selectText();
});