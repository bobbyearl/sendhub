/**
* CONTROLLER - MAIN
**/
sendhub.controller('MainController', function($scope, StatusService, SettingsService, SendHubService) {
  
  $scope.status = StatusService;
  $scope.settings = SettingsService;
  
  $scope.init = function() {
    $(function() {
      $('body').addClass('angular-ready');
      $('[data-toggle="tooltip"]').tooltip()
    });    
  };
  
  // Debugging messages
  $scope.message = function() {
    SendHubService.sendMessage($scope.settings.getContact(), 'TEST').success(function(data) {
      console.log(data);
    }).error(function(data) {
      console.log('ERRR');
      console.log(data);
    });
  }
  
  // Listen for overages
  $scope.$on($scope.settings.OVERAGE, function(event, data) {
    var overage = data.overage;
    SendHubService.sendMessage($scope.settings.getContact(), $scope.settings.message).success(function(r) {
      overage.status = 'success';
    }).error(function(r) {
      overage.message = r.error;
      overage.status = 'danger';
    });
  });
  
});


/**
* CONTROLLER - AUDIO
**/
sendhub.controller('AudioController', function($scope, $interval, StatusService, SettingsService) {
  
  $scope.status = StatusService;
  $scope.settings = SettingsService;
  $scope.reset = function() {
    $scope.currentOverage = {
      status: '',
      message: '',
      start: 0,
      stop: 0,
      volume: 0
    };
  }
  
  // Listen to status changes
  $scope.$on($scope.status.UPDATED, function(event, data) {
    switch (data.status) {
      case $scope.status.STATUSES.RUNNING:
        
        $scope.reset();
        $scope.interval = $interval(function() {
          $scope.settings.volume = Math.floor($scope.settings.soundMeter.instant.toFixed(2) * 100);
          $scope.settings.percent = $scope.settings.volume + '%';
          $scope.$safeApply();
          
          var over = $scope.settings.volume >= $scope.settings.threshold,
              current = (new Date()).getTime();
          
          // Catch the start of an overage
          if (over && $scope.currentOverage.start == 0) {
            $scope.currentOverage.start = current;
            
          // Catch the end of an overage
          } else if (!over && $scope.currentOverage.start != 0) {
            
            // Ignore overages less than 1 second long
            if ($scope.currentOverage.start >= current - 1000) {
              $scope.currentOverage.start = 0;
            } else {
              $scope.currentOverage.stop = current; 
            }
          }
          
          // Record highest volume
          if ($scope.currentOverage.start != 0 && $scope.settings.volume > $scope.currentOverage.volume) {
            $scope.currentOverage.volume = $scope.settings.volume;
          }
          
          // Record a full overage
          if ($scope.currentOverage.start != 0 && $scope.currentOverage.stop != 0) {
            $scope.settings.addOverage($scope.currentOverage);
            $scope.reset();
          }
          
        }, 200);
        
      break;
      default:
        $interval.cancel($scope.interval);    
      break;
    }
  });

  // Browser inconsistencies
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

  // Verify audio will work (main application entry point)
  try {

    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    window.audioContext = new AudioContext();

    // Request access to microphone
    navigator.getUserMedia({ audio: true, video: false }, function(stream) {

      // Create our sound meter (If it's not broke, don't fix it)
      $scope.settings.soundMeter = new SoundMeter(window.audioContext);
      $scope.settings.soundMeter.connectToSource(stream);
      
      $scope.status.set($scope.status.STATUSES.AUDIOREADY);
      $scope.$safeApply();

    }, function() {
      $scope.status.set($scope.status.STATUSES.MICROPHONE);
      $scope.$safeApply();
    });

  } catch (e) {
    $scope.status.set($scope.status.STATUSES.UNSUPPORTED);
    $scope.$safeApply();
  }
  
});


/**
* CONTROLLER - SETTINGS
**/
sendhub.controller('SettingsController', function($scope, StatusService, SettingsService, SendHubService) {

  $scope.status = StatusService;
  $scope.settings = SettingsService;
  $scope.errors = {
    ajax: false
  };
  
  // Retrieves the contacts and sets the selected contact
  $scope.getContacts = function(id) {
    SendHubService.getContacts().success(function(data) {
      $scope.settings.contacts = data.objects;
      $scope.settings.id = id;
    }).error(function() {
      $scope.errors.ajax = true;
    });
  }
  
  // Opens the modal window
  $scope.open = function() {
    $($scope.settings.modal).modal('show');
  };
  
  // Closes the modal window
  $scope.close = function() {
    $($scope.settings.modal).modal('hide');
  };
  
  // Start the application
  $scope.start = function() {
    $scope.status.set($scope.status.STATUSES.RUNNING);
  }
  
  // Stop the application
  $scope.stop = function() {
    $scope.status.set($scope.status.STATUSES.READY);
  }
  
  // Listens for updated settings
  $scope.$on($scope.settings.UPDATED, function(event, data) {
    $scope.close();
    $scope.getContacts(data.id);
  });
  
  // Only watch our settings form until the audio is ready
  $scope.$on($scope.status.UPDATED, function(event, data) {
    if (data.status == $scope.status.STATUSES.AUDIOREADY) {
      $scope.$watch('form.$valid', function() {
        $scope.status.set($scope.form.$valid ? $scope.status.STATUSES.READY : $scope.status.STATUSES.SETTINGS);
      });
    }
  });
  
});


/**
* CONTROLLER - CONTACT ADD
**/
sendhub.controller('ContactAddController', function($scope, SettingsService, SendHubService) {

  $scope.settings = SettingsService;
  $scope.name = '';
  $scope.number = '';
  $scope.errors = {
    ajax: false
  };

  // Attempts to add the contact and refresh the SettingsService
  $scope.add = function() {
    if ($scope.form.$valid) {
      SendHubService.addContact($scope.name, $scope.number).success(function(data) {
        $scope.settings.refresh(data.id);
      }).error(function() {
        $scope.errors.ajax = true;
      });
    }
  }
  
});