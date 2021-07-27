// Makes requests to the Salesforce REST API based on criteria
function makeRequest(searchTerm, searchType, object, recordTypeId) {
  let salesforceService = getSalesforceService();

  let orgBase = "INSTANCE.my.salesforce.com/";
  // Gets API call url
  let url;
  if (searchType == "search") {
    url = "INSTANCE.my.salesforce.com/services/data/v51.0/parameterizedSearch/?q=" + removeSpaces(searchTerm) + "&sobject=" + object;
    if (recordTypeId) {
      url += "&" + object + ".where=RecordTypeId='" + recordTypeId + "'";
    } 
  }
  else {
    url = "INSTANCE.my.salesforce.com/services/data/v51.0/sobjects/"  + searchType + "/" + searchTerm;
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