'use strict';

/**
* SendHub Coding Challenge
* Bobby Earl
* 2015/01/22
*
* Notes:
*   - I need to pay better attention to documentation.  
*       I missed the option where the messages api accepts a number instead of a contact's ID, 
*       which explains all the contact functionality I built.  I'm counting this as my extra credit.
*   - I vaguely remembered this, but Chrome (or maybe Angular) randomly rounds large digits.  Thanks for providing id_str.
**/

var sendhub = angular.module('sendhub', ['Scope.safeApply']);