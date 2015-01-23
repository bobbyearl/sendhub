/**
* SERVICE - STATUS
**/
sendhub.service('StatusService', function($rootScope) {
  
  // Status enums
  this.UPDATED = 'STATUS-UPDATED';
  this.STATUSES = {
    LOADING: 'loading',
    UNKNOWN: 'unknown',
    UNSUPPORTED: 'unsupported',
    MICROPHONE: 'microphone',
    SETTINGS: 'settings',
    AUDIOREADY: 'audioready',
    READY: 'ready',
    RUNNING: 'running'
  };
  
  // Store private status
  var _status = {};
  
  // Create private statuses
  for (var s in this.STATUSES) {
    _status[this.STATUSES[s]] = false;
  }
  
  // Default status
  _status[this.STATUSES.LOADING] = true;
  
  // Read the status
  this.get = function() {
    return _status;
  }
  
  // Write the status
  this.set = function(status) {
    for (var s in _status) {
      _status[s] = s == status;
      if (_status[s]) {
        $rootScope.$broadcast(this.UPDATED, { status: status });
      }
    }
  };
  
});


/**
* SERVICE - SETTINGS
**/
sendhub.service('SettingsService', function($rootScope) {
  
  this.UPDATED = 'SETTINGS-UPDATED';
  this.OVERAGE = 'OVERAGE';
  
  this.message = 'You are too loud.  Please quiet down.';
  this.modal = '#modal-contact-add';
  this.threshold = 5;
  this.volume = 0;
  this.percent = '0%';
  this.phone = '';
  this.id = '';
  this.contacts = [];
  this.overages = [];
  this.soundMeter;
  
  this.getContact = function() {
    return (typeof this.id == 'string' && this.id != '') ? this.id : this.phone;
  }
  
  this.addOverage = function(overage) {
    this.overages.push(overage);
    $rootScope.$broadcast(this.OVERAGE, { overage: overage });
  }
  
  // Broadcasts that the settings (specifically the id) have been updated
  this.refresh = function(id) {
    $rootScope.$broadcast(this.UPDATED, { id: id });
  }
  
  // Find and return a contact by its ID
  this.findContactById = function(id) {
    for (var i = 0, j = this.contacts.length; i < j; i++) {
      if (this.contacts[i].id == id) {
        return this.contacts[i];
      }
    }
  }
});


/**
* SERVICE - SENDHUB
**/
sendhub.service('SendHubService', function($http) {
  
  var serviceContacts = 'contacts',
      serviceMessages = 'messages',
      proxybase = 'http://cors-anywhere.herokuapp.com/',
      sendhubbase = 'https://api.sendhub.com/v1/',
      params = {
        username: '6504378319',
        api_key: '13b60bd5e28e11e850e041ff0346782bf541096c',
        limit: 100 // Undocumented (or regulated) parameter
      };
  
  function proxy(service) {
    return proxybase + encodeURI(sendhubbase + service + '/?' + $.param(params));
  }
  
  this.sendMessage = function(id, text) {
    return $http.post(proxy(serviceMessages), { 'contacts': [ id ], 'text': text });
  };
  
  this.addContact = function(name, number) {
    return $http.post(proxy(serviceContacts), { name: name, number: number });
  };
  
  this.getContacts = function() {
    return $http.get('assets/data/contacts.json');
    return $http.get(proxy(serviceContacts));
  };
  
});