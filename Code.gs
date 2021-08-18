// Makes requests to the Salesforce REST API based on criteria
function makeRequest(searchTerm, searchType, object, recordTypeId) {
  let salesforceService = getSalesforceService();

  let orgBase = "https://INSTANCE.my.salesforce.com/";
  // Gets API call url
  let url;
  if (searchType == "search") {
    url = "https://INSTANCE.my.salesforce.com/services/data/v51.0/parameterizedSearch/?q=" + removeSpaces(searchTerm) + "&sobject=" + object;
    if (recordTypeId) {
      url += "&" + object + ".where=RecordTypeId='" + recordTypeId + "'";
    } 
  }
  else {
    url = "https://INSTANCE.my.salesforce.com/services/data/v51.0/sobjects/"  + searchType + "/" + searchTerm;
  }
  let response = UrlFetchApp.fetch(url, {
    headers: {
      Authorization: 'Bearer ' + salesforceService.getAccessToken()
    }
  });
  
  let json = JSON.parse(response);
  let results = [];
  if (searchType == "search") {
    for (let i = 0; i < json.searchRecords.length; i++) {
      let itemUrl = json.searchRecords[i].attributes.url;
      let response = UrlFetchApp.fetch(orgBase + itemUrl, {
        headers: {
        Authorization: 'Bearer ' + salesforceService.getAccessToken()
      }
    })
    results.push(JSON.parse(response));
    } 
  }
  else {
    return json;
  }
  return results;
}

// URL Encodes spaces as %20 for use in API calls
function removeSpaces(text) {
  let letters = text.split("");
  for (let i = 0; i < letters.length; i++) {
    if (letters[i] == " ") {
      letters[i] = "%20";
    }
  }
  return letters.join("");
}

function pushToSalesforce(payload, contact) {
  let salesforceService = getSalesforceService();
  let url = "https://INSTANCE.my.salesforce.com/services/data/v51.0/sobjects/Contact/" + contact.Id;
  Logger.log(contact);
  let contactPayload = payload;

  let response = UrlFetchApp.fetch(url, {
    'method' : 'patch',
    'contentType': 'application/json',
    'payload' : JSON.stringify(contactPayload),
    headers: {
      Authorization: 'Bearer ' + salesforceService.getAccessToken()},
    })
}
function pushToSheets(url, budgetData, numYears, schoolData, sld) {
  let array = url.split("/");
  let spreadsheetId; 
  for (let i = 0; i < array.length; i++) {
    if (array[i] == "d") {
      spreadsheetId = array[i + 1];
    }
  }
  let spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  let sheets = spreadsheet.getSheets();
  let sheet;
  let exists = false;
  //for (let i = 0; i < sheets.length; i++) {
    //if (sheets[i].getName().includes("udget")) {
      //sheet = sheets[i];
      //break;
    //}
    //else {
      //sheet = null;
    //}
  //}
  //if (sheet == null) {
  let date = new Date();
  for (let i = 0; i < sheets.length; i++) {
    if (sheets[i].getName() == ("Budget " + (date.getMonth() + 1) + "/" + date.getDate())) {
      sheet = sheets[i];
      exists = true;
    }
  }
  if (exists != true) {
    sheet = spreadsheet.insertSheet("Budget " + (date.getMonth() + 1) + "/" + date.getDate());
  }
  //}

  sheet.getRange('A1').setValue("Anticipated Starting Salary").setFontWeight("bold").setBorder(true, true, null, true, null, null);
  sheet.getRange('A2').setValue("Total Maximum SLD").setFontWeight("bold").setBorder(null, true, true, true, null, null);
  sheet.getRange('B1').setValue(sld).setBorder(true, null, null, true, null, null).setNumberFormat("$#,###");
  sheet.getRange('B2').setFormulaR1C1("=R[-1]C[0] / 2").setBorder(null, null, true, true, null, null).setNumberFormat("$#,###");

  sheet.getRange('A4').setValue("Year").setFontWeight("bold").setBorder(true, true, true, true, null, null).setFontColor("white");
  sheet.getRange('A5').setValue("Student Loan Debt").setFontWeight("bold").setBorder(null, true, null, true, null, null);
  sheet.getRange('A6').setValue("Student Out of Pocket").setFontWeight("bold").setBorder(null, true, null, true, null, null);
  sheet.getRange('A7').setValue("Family Out of Pocket").setFontWeight("bold").setBorder(null, true, null, true, null, null);
  sheet.getRange('A8').setValue("Family Budget").setFontWeight("bold").setBorder(true, true, true, true, null, null);

  sheet.autoResizeColumn(1);

  //let charCode = "a".charCodeAt(0);
  //let character = String.fromCharCode(67);

  for (let i = 0; i <= numYears; i++) {
    if (i == numYears) {
      sheet.getRange(4, 2 + i, 1).setBorder(null, null, true, null, null, null).setFontColor("white");
      sheet.getRange(8, 2 + i, 1).setBorder(true, true, null, null, null, null);
      let range = sheet.getRange(4, 2 + i, 5).setFontWeight("bold").setBorder(true, true, true, true, null, null).setNumberFormat("$#,###");
      let formula1 = '=CONCAT("Total", "")';
      let formula2 = "=SUM(B5:" + (String.fromCharCode("B".charCodeAt(0) + numYears - 1)) + "5)";
      let formula3 = "=SUM(B6:" + (String.fromCharCode("B".charCodeAt(0) + numYears - 1)) + "6)";
      let formula4 = "=SUM(B7:" + (String.fromCharCode("B".charCodeAt(0) + numYears - 1)) + "7)";
      let formula5 = "=SUM(B8:" + (String.fromCharCode("B".charCodeAt(0) + numYears - 1)) + "8)";

      range.setFormulas(
        [
          [formula1], 
          [formula2], 
          [formula3], 
          [formula4], 
          [formula5]
        ]);
    }
    else {
      sheet.getRange(4, 2 + i, 1).setBorder(null, null, true, null, null, null).setFontColor("white");
      let range = sheet.getRange(4, 2 + i, 4).setBorder(true, true, true, true, null, null);
      sheet.getRange(4, 1, 1, 2 + numYears).setBackground("#1b7a1e");
      sheet.getRange(5, 2 + i, 3).setNumberFormat("$#,###");
      range.setValues([[i + 1], [budgetData[0]], [budgetData[1]], [budgetData[2]]]);
      let lastCell = range.getA1Notation().split(":")[1];
      let nextCell = lastCell.split("")[0].concat("", (Number(lastCell.split("")[1]) +1));

      let totalRange =  sheet.getRange(nextCell).setFontWeight("bold").setBorder(true, null, true, null, null, null).setNumberFormat("$#,###");
      let newRange = range.getA1Notation().split(":")[0].split("")[0].concat("", Number(range.getA1Notation().split(":")[0].split("")[1]) + 1).concat(":", range.getA1Notation().split(":")[1])

      totalRange.setFormula("=SUM("+ newRange + ")").setNumberFormat("$#,###");
    }
  } 
  let topLeft = "12";
  let rowNum = 0;

  sheet.getRange("10:10").setBackground("#0a1546");
  let logo = sheet.insertImage("https://lh3.googleusercontent.com/_bb9PW0ney82_xb321OscyOsDu07vT62M-H1LBEBkqtBTWLRh9ignyQslK46oQC3uXfSn_o2nRC2Khw7Z8RVXalOvTL8b6YXpZqj_Jg_jkI4DwBZ7LuD_v-ndjaBAka_YB_e58or5A=w2400", 8, 1);
  logo.setWidth(187);
  logo.setHeight(60);

  for (let i = 0; i < schoolData.length; i++) {
    // [The Ohio State University, 30181, 7992, 1082, 39255, , 39255, 48500, -9245]
    if (rowNum == 0) {
      if (i < 2) {
        topLeft = "12";
      }
      if (i > 2 && i < 5) {
        topLeft = "22";
      }
      if (i > 5 && i < 8) {
        topLeft = "32";
      }
      if (i > 8 && i < 11) {
        topLeft = "42";
      }
      if (i > 11 && i < 14) {
        topLeft = "52";
      }
      if (i > 14 && i < 17) {
        topLeft = "62";
      }
      if (i > 17 && i < 20) {
        topLeft = "72";
      }
      printSchool(topLeft, rowNum, schoolData[i], sheet)
      rowNum += 1;
      if (rowNum == 2) {
        rowNum = 0;
      }
    }
    else {
      printSchool(topLeft, rowNum, schoolData[i], sheet)
      if (rowNum == 2) {
        rowNum = 0;
      }
      else {
        rowNum += 1;
      }
    }
  }
}


function printSchool(topLeft, rowNum, schoolData, sheet) {
  let topLeftA1 = Number(topLeft);
  if (rowNum == 0) {
    sheet.getRange("A" + topLeftA1).setValue(schoolData[0]).setFontWeight("bold").setBorder(true, true, true, null, null, null).setBackground("#1b7a1e").setFontColor("white");
    sheet.getRange("A" + (topLeftA1 + 1)).setValue("Tuition").setFontWeight("bold").setBorder(null, true, null, null, null, null);
    sheet.getRange("A" + (topLeftA1 + 2)).setValue("Room & Board").setFontWeight("bold").setBorder(null, true, null, null, null, null);
    sheet.getRange("A" + (topLeftA1 + 3)).setValue("Books").setFontWeight("bold").setBorder(null, true, null, null, null, null);
    sheet.getRange("A" + (topLeftA1 + 4)).setValue("Cost of Attendance").setFontWeight("bold").setBorder(null, true, null, null, null, null);
    sheet.getRange("A" + (topLeftA1 + 5)).setValue("Financial Aid").setFontWeight("bold").setBorder(null, true, null, null, null, null);
    sheet.getRange("A" + (topLeftA1 + 6)).setValue("True Cost of Attendance").setFontWeight("bold").setBorder(null, true, null, null, null, null);
    sheet.getRange("A" + (topLeftA1 + 7)).setValue("Family Budget").setFontWeight("bold").setBorder(null, true, null, null, null, null);
    sheet.getRange("A" + (topLeftA1 + 8)).setValue("Gap Difference").setFontWeight("bold").setBorder(null, true, true, null, null, null);

    sheet.getRange("B" + (topLeftA1)).setBorder(true, null, true, true, null, null).setNumberFormat("$#,###").setBackground("#1b7a1e");
    sheet.getRange("B" + (topLeftA1 + 1)).setValue(schoolData[1]).setBorder(null, null, null, true, null, null).setNumberFormat("$#,###");
    sheet.getRange("B" + (topLeftA1 + 2)).setValue(schoolData[2]).setBorder(null, null, null, true, null, null).setNumberFormat("$#,###");
    sheet.getRange("B" + (topLeftA1 + 3)).setValue(schoolData[3]).setBorder(null, null, null, true, null, null).setNumberFormat("$#,###");
    sheet.getRange("B" + (topLeftA1 + 4)).setFormulaR1C1("=SUM(R[-3]C[0]:R[-1]C[0])").setBorder(null, null, null, true, null, null).setNumberFormat("$#,###");
    sheet.getRange("B" + (topLeftA1 + 5)).setValue(schoolData[5]).setBorder(null, null, null, true, null, null).setNumberFormat("$#,###");
    sheet.getRange("B" + (topLeftA1 + 6)).setFormulaR1C1("=R[-2]C[0] - R[-1]C[0]").setBorder(null, null, null, true, null, null).setNumberFormat("$#,###");
    sheet.getRange("B" + (topLeftA1 + 7)).setValue(schoolData[7]).setBorder(null, null, null, true, null, null).setNumberFormat("$#,###");
    sheet.getRange("B" + (topLeftA1 + 8)).setFormulaR1C1("=R[-2]C[0] - R[-1]C[0]").setBorder(null, null, true, true, null, null).setNumberFormat("$#,###");
  }
  if (rowNum == 1) {
    sheet.getRange("D" + topLeftA1).setValue(schoolData[0]).setFontWeight("bold").setBorder(true, true, true, null, null, null).setBackground("#1b7a1e").setFontColor("white");
    sheet.getRange("D" + (topLeftA1 + 1)).setValue("Tuition").setFontWeight("bold").setBorder(null, true, null, null, null, null);
    sheet.getRange("D" + (topLeftA1 + 2)).setValue("Room & Board").setFontWeight("bold").setBorder(null, true, null, null, null, null);
    sheet.getRange("D" + (topLeftA1 + 3)).setValue("Books").setFontWeight("bold").setBorder(null, true, null, null, null, null);
    sheet.getRange("D" + (topLeftA1 + 4)).setValue("Cost of Attendance").setFontWeight("bold").setBorder(null, true, null, null, null, null);
    sheet.getRange("D" + (topLeftA1 + 5)).setValue("Financial Aid").setFontWeight("bold").setBorder(null, true, null, null, null, null);
    sheet.getRange("D" + (topLeftA1 + 6)).setValue("True Cost of Attendance").setFontWeight("bold").setBorder(null, true, null, null, null, null);
    sheet.getRange("D" + (topLeftA1 + 7)).setValue("Family Budget").setFontWeight("bold").setBorder(null, true, null, null, null, null);
    sheet.getRange("D" + (topLeftA1 + 8)).setValue("Gap Difference").setFontWeight("bold").setBorder(null, true, true, null, null, null)

    sheet.getRange("E" + (topLeftA1)).setBorder(true, null, true, true, null, null).setNumberFormat("$#,###").setBackground("#1b7a1e");
    sheet.getRange("E" + (topLeftA1 + 1)).setValue(schoolData[1]).setBorder(null, null, null, true, null, null).setNumberFormat("$#,###");
    sheet.getRange("E" + (topLeftA1 + 2)).setValue(schoolData[2]).setBorder(null, null, null, true, null, null).setNumberFormat("$#,###");
    sheet.getRange("E" + (topLeftA1 + 3)).setValue(schoolData[3]).setBorder(null, null, null, true, null, null).setNumberFormat("$#,###");
    sheet.getRange("E" + (topLeftA1 + 4)).setFormulaR1C1("=SUM(R[-3]C[0]:R[-1]C[0])").setBorder(null, null, null, true, null, null).setNumberFormat("$#,###");
    sheet.getRange("E" + (topLeftA1 + 5)).setValue(schoolData[5]).setBorder(null, null, null, true, null, null).setNumberFormat("$#,###");
    sheet.getRange("E" + (topLeftA1 + 6)).setFormulaR1C1("=R[-2]C[0] - R[-1]C[0]").setBorder(null, null, null, true, null, null).setNumberFormat("$#,###");
    sheet.getRange("E" + (topLeftA1 + 7)).setValue(schoolData[7]).setBorder(null, null, null, true, null, null).setNumberFormat("$#,###");
    sheet.getRange("E" + (topLeftA1 + 8)).setFormulaR1C1("=R[-2]C[0] - R[-1]C[0]").setBorder(null, null, true, true, null, null).setNumberFormat("$#,###");

  }
  if (rowNum == 2) {
    sheet.getRange("G" + topLeftA1).setValue(schoolData[0]).setFontWeight("bold").setBorder(true, true, true, null, null, null).setBackground("#1b7a1e").setFontColor("white");
    sheet.getRange("G" + (topLeftA1 + 1)).setValue("Tuition").setFontWeight("bold").setBorder(null, true, null, null, null, null);
    sheet.getRange("G" + (topLeftA1 + 2)).setValue("Room & Board").setFontWeight("bold").setBorder(null, true, null, null, null, null);
    sheet.getRange("G" + (topLeftA1 + 3)).setValue("Books").setFontWeight("bold").setBorder(null, true, null, null, null, null);
    sheet.getRange("G" + (topLeftA1 + 4)).setValue("Cost of Attendance").setFontWeight("bold").setBorder(null, true, null, null, null, null);
    sheet.getRange("G" + (topLeftA1 + 5)).setValue("Financial Aid").setFontWeight("bold").setBorder(null, true, null, null, null, null);
    sheet.getRange("G" + (topLeftA1 + 6)).setValue("True Cost of Attendance").setFontWeight("bold").setBorder(null, true, null, null, null, null);
    sheet.getRange("G" + (topLeftA1 + 7)).setValue("Family Budget").setFontWeight("bold").setBorder(null, true, null, null, null, null);
    sheet.getRange("G" + (topLeftA1 + 8)).setValue("Gap Difference").setFontWeight("bold").setBorder(null, true, true, null, null, null)

    sheet.getRange("H" + (topLeftA1)).setBorder(true, null, true, true, null, null).setNumberFormat("$#,###").setBackground("#1b7a1e");
    sheet.getRange("H" + (topLeftA1 + 1)).setValue(schoolData[1]).setBorder(null, null, null, true, null, null).setNumberFormat("$#,###");
    sheet.getRange("H" + (topLeftA1 + 2)).setValue(schoolData[2]).setBorder(null, null, null, true, null, null).setNumberFormat("$#,###");
    sheet.getRange("H" + (topLeftA1 + 3)).setValue(schoolData[3]).setBorder(null, null, null, true, null, null).setNumberFormat("$#,###");
    sheet.getRange("H" + (topLeftA1 + 4)).setFormulaR1C1("=SUM(R[-3]C[0]:R[-1]C[0])").setBorder(null, null, null, true, null, null).setNumberFormat("$#,###");
    sheet.getRange("H" + (topLeftA1 + 5)).setValue(schoolData[5]).setBorder(null, null, null, true, null, null).setNumberFormat("$#,###");
    sheet.getRange("H" + (topLeftA1 + 6)).setFormulaR1C1("=R[-2]C[0] - R[-1]C[0]").setBorder(null, null, null, true, null, null).setNumberFormat("$#,###");
    sheet.getRange("H" + (topLeftA1 + 7)).setValue(schoolData[7]).setBorder(null, null, null, true, null, null).setNumberFormat("$#,###");
    sheet.getRange("H" + (topLeftA1 + 8)).setFormulaR1C1("=R[-2]C[0] - R[-1]C[0]").setBorder(null, null, true, true, null, null).setNumberFormat("$#,###");

  }

}

function incrementA1Notation(a1, increment) {
  return a1.split("")[0].concat("", (Number(lastCell.split("")[1]) + increment));
}

function getSalesforceService() {
  // Create a new service with the given name. The name will be used when
  // persisting the authorized token, so ensure it is unique within the
  // scope of the property store.
  return OAuth2.createService('salesforce')
      // Find endpoints here -> https://help.salesforce.com/articleView?id=sf.remoteaccess_oauth_endpoints.htm&type=5
      .setAuthorizationBaseUrl('https://login.salesforce.com/services/oauth2/authorize')
      .setTokenUrl('https://login.salesforce.com/services/oauth2/token')

      // Set the client ID and secret
      .setClientId('CLIENT_ID')
      .setClientSecret('CLIENT_SECRET')

      // Set the name of the callback function in the script referenced
      // above that should be invoked to complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())

      // Set the scopes to request. 
      // Find scopes here -> https://help.salesforce.com/articleView?id=sf.remoteaccess_oauth_tokens_scopes.htm&type=5
      .setScope('api')

      // Sets the login hint, which will prevent the account chooser screen
      // from being shown to users logged in with multiple accounts.
      //.setParam('login_hint', Session.getEffectiveUser().getEmail())

      // Requests offline access.
      .setParam('access_type', 'offline-access')

      // Consent prompt is required to ensure a refresh token is always
      // returned when requesting offline access.
      .setParam('prompt', 'consent')

      .setCache(CacheService.getUserCache());
}

function showSidebar() {
  let salesforceService = getSalesforceService();
  if (!salesforceService.hasAccess()) {
    let authorizationUrl = salesforceService.getAuthorizationUrl();
    return authorizationUrl;
  } 
  else {
    let authorizationUrl = salesforceService.getAuthorizationUrl();
    return authorizationUrl;
  }
}

function authCallback(request) {
  let salesforceService = getSalesforceService();
  let isAuthorized = salesforceService.handleCallback(request);
  if (isAuthorized) {
    Logger.log("Success!");
    return HtmlService.createHtmlOutput('<p>Successfully authenticated. Please close this window.</p>');
  } else {
    Logger.log("Failure!");
    return HtmlService.createHtmlOutput('<p>Something went wrong. Please referesh and try again.</p>')
  }
}

// Allows separate html pages to be included
function include(filename){
   return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Initializes web app
function doGet() {
  return HtmlService.createTemplateFromFile('index').evaluate();
}