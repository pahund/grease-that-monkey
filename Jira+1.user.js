// ==UserScript== 
// @name Jira +1 
// @namespace Jira 
// @include https://jira.corp.mobile.de/jira/browse/* 
// @version 2 
// @grant none 
// ==/UserScript== 
AJS.$(document).ready(function() { 
 
    AJS.$(".toolbar-split-right").append("<ul class='toolbar-group pluggable-ops'><li class='toolbar-item'><a id='minusOne' title='Den vorherigen Vorgang aufrufen' class='toolbar-trigger' rel='nofollow' href='#'><span class='icon icon-previous'></span>Previous Ticket</a></li><li class='toolbar-item'><a id='plusOne' title='Den nachfolgenden Vorgang aufrufen' class='toolbar-trigger' rel='nofollow' href='#'>Next Ticket<span class='icon icon-next'></span></a></li></ul>"); 
    
    function switchPage(direction) {
        var newURL,  
       	    help,  
	    number;  
        help = window.location.href.split("-"); 
        if (help.length >= 2) {
            if (direction === "+1") { 
	       	number = parseInt(help[1], 10) + 1;         	
            } else {
               	number = parseInt(help[1], 10) - 1;
            }
            newURL = help[0] + "-" + number;  
            window.location.href = newURL; 
        } else {
	    console.log("Something went wrong...");
        }
    };
        
    AJS.$("#plusOne").click(function () { 
	switchPage("+1");
    }); 
     
    AJS.$("#minusOne").click(function () { 
    	switchPage("-1");
    });    
});
