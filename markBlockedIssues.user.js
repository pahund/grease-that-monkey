// ==UserScript==
// @name         Mark blocked tickets
// @namespace    Jira
// @version      0.1
// @description  mark blocked tickets and makes the description, why it's blocked available via mouseover
// @author       Lars Opitz
// @include      https://jira.corp.mobile.de/jira/secure/RapidBoard.jspa*
// @grant        none
// ==/UserScript==

(function jiraRapidBoardShowEpics($) {

    var BLOCKING_REASON_FIELD_NAME = "customfield_12280";
    var LOCAL_STORAGE_STATE_PROPERTY = "de.mobile.jira.mark.blocked.tickets";
    var $baseUrl = window.location.href;
    var $setupCalled = false;
    $baseUrl = $baseUrl.substr(0, $baseUrl.indexOf("/secure/RapidBoard.jspa"));

    function refresh() {
        if (isFeatureEnabled()) {
            updateIssueVisualizationForIssues();
        } else {
            resetBoard();
        }
    }

    function isFeatureEnabled() {
        return (localStorage[LOCAL_STORAGE_STATE_PROPERTY] == "true");
    }
    
    function toggleFeatureStatus() {
        localStorage[LOCAL_STORAGE_STATE_PROPERTY] = !isFeatureEnabled();
    }

    function updateIssueVisualizationForIssues() {
        var $root = $('div#ghx-pool').find(".js-issue").each (function() {
            var issueId = $(this).data("issue-key");
            fetchIssueWithIdAndUpdateVisualization(issueId);
        });
    }

    function resetBoard() {
        $(".blocked").remove();
    }

    function fetchIssueWithIdAndUpdateVisualization(issueId) {
        var issueUrl = $baseUrl + "/rest/api/2/issue/"+issueId;
        $.getJSON(issueUrl, function(data) {
            var fields = data.fields;
            updateIssueVisualizationForIssueWithIdAndFields(issueId, fields);
        });
    }

    function updateIssueVisualizationForIssueWithIdAndFields(issueId, fields) {
        if (shouldDrawBlockedStatusForIssueWithFields(fields)) {
            drawBlockingStatusForIssueWithIdAndFields(issueId, fields)
        }
    }

    function shouldDrawBlockedStatusForIssueWithFields(fields) {
        return typeof fields !== "undefined" && BLOCKING_REASON_FIELD_NAME in fields;
    }
    
    function drawBlockingStatusForIssueWithIdAndFields(issueId, fields) {
        var issue = $("div#ghx-pool").find("[data-issue-key='" + issueId + "']");
        issue.removeClass("blocked");
        issue.find(".blocking-container").remove();
        if (isIssueWithFieldsBlocked(fields)) {
            issue.addClass("blocked");
            var divElement = $("<div class='blocking-container'>");
            divElement.appendTo(issue.find(".ghx-avatar"));
            reasonDiv = $("<div class='blocking-reason'>");
            reasonDiv.append(getBlockingReasonOfIssueWithFields(fields));
            reasonDiv.appendTo(divElement);
            divElement.mouseover(function() {
                $($(this).children()[0]).show();
            });
            divElement.mouseout(function() {
                $($(this).children()[0]).hide();
            });            
        }
    }
    
    function isIssueWithFieldsBlocked(fields) {
        return fields[BLOCKING_REASON_FIELD_NAME];
    }
    
    function getBlockingReasonOfIssueWithFields(fields) {
        return fields[BLOCKING_REASON_FIELD_NAME];
    }

    function setup() {
        var blockedIconCssPart = "background: url('data:image/png;base64,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');"
        var css = ".blocking-container {" + blockedIconCssPart + "background-position: top left; background-size: contain; background-repeat: no-repeat; height: 32px; position: absolute; left: 0; width: 32px; z-index: 1}"+
            ".blocking-reason {display: none; position: absolute; padding: 5px; left: 33px; top: 5px; background-color: rgb(255, 200, 200);}" +
            ".blocked {background-color: rgb(255, 128, 128)}";
        $('head').append($('<style></style>').html(css));
        $("#js-work-quickfilters").append('<dd><a role="button" id="enableMarkBlockedTicketsButton" href="#" class="js-quickfilter-button" title="Mark blocked tickets">Mark blocked tickets</a></dd>');
        $("#enableMarkBlockedTicketsButton").on("click", function() {
            toggleFeatureStatus();
            refreshEnableMarkBlockedTicketsButtonState();
            refresh();
        });
        refreshEnableMarkBlockedTicketsButtonState();
    }
    
    function refreshEnableMarkBlockedTicketsButtonState() {
        var button = $("#enableMarkBlockedTicketsButton");
        if (isFeatureEnabled()) {
            button.addClass("ghx-active");
        } else {
            button.removeClass("ghx-active");
        }
    }
        
    function initializeSetup() {
        $(document).bind('DOMNodeInserted', function(e) {
            if (!!document.getElementById ("js-work-quickfilters") && !$setupCalled) {
                $setupCalled = true;
                setup();
            }
        });
    }

    $(function() {
        initializeSetup();
        refresh();
        var handlerActive = false;
        $("#ghx-pool").live("DOMNodeInserted", function(event) {
            var $this = $(event.target);
            if ($this.closest('#ghx-column-header-group').length > 0 && !handlerActive) {
                handlerActive = true;
                refresh();
                handlerActive = false;
            }
        });

    });

}(jQuery));