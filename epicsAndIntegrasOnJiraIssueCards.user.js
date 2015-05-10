// ==UserScript==
// @name         Show Epics and Integras on Team ticket
// @namespace    Jira
// @version      0.1
// @description  shows the associated epic and Integras as a label on top of the ticket
// @author       Lars Opitz
// @include      https://jira.corp.mobile.de/jira/secure/RapidBoard.jspa*
// @grant        none
// ==/UserScript==

(function jiraRapidBoardShowEpics($) {

    var FEATURE_BUTTON_ID = "enableEpicsAndIntegraVisualization";
    var LOCAL_STORAGE_STATE_PROPERTY = "de.mobile.jira.epicsAndIntegras";
    var INTEGRA = "integra";
    var LABEL_FIELD_NAME = "customfield_10100";
    var INTEGRA_FIELD_NAME = "customfield_10233";

    var $issueCache = {};
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
        $(".epics").remove();
        $(".integra").remove();
    }

    function fetchIssueWithIdAndUpdateVisualization(issueId) {
        if (issueId in $issueCache) {
            updateIssueVisualizationForIssueWithId(issueId);
        } else {
            $issueCache[issueId] = {epics: [], integra: ""};
            var issueUrl = $baseUrl + "/rest/api/2/issue/"+issueId;
            $.getJSON(issueUrl, function(data) {
                var fields = data.fields;
                storeIntegraForIssue(issueId, fields);
                storeEpicsForIssue(issueId, fields);
                updateIssueVisualizationForIssueWithId(issueId);
            });
        }
    }

    function storeIntegraForIssue(issueId, fields) {
        if (isIntegraInformationAvailable(fields)) {
            var integra = fields[INTEGRA_FIELD_NAME];
            if (! (integra)) {
                fields[LABEL_FIELD_NAME].forEach (function (label) {
                    if (/integra/i.test(label)) {
                        integra = label;
                    }
                });
            }
            if (integra) {
                $issueCache[issueId].integra = integra.replace(/integra/i, "");
            }
        }
    }

    function isIntegraInformationAvailable(fields) {
        return typeof fields !== "undefined" && (isIntegraFieldSetInFields(fields) || areLabelsAvailableInFields(fields));
    }

    function isIntegraFieldSetInFields(fields) {
        return INTEGRA_FIELD_NAME in fields && fields[INTEGRA_FIELD_NAME];
    }

    function areLabelsAvailableInFields(fields) {
        return LABEL_FIELD_NAME in fields && fields[LABEL_FIELD_NAME];
    }

    function storeEpicsForIssue(issueId, fields) {
        if (typeof fields !== "undefined" && "issuelinks" in fields) {
            $.each(fields.issuelinks, function(counter, linkedIssue) {
                if ("outwardIssue" in linkedIssue && "key" in linkedIssue.outwardIssue) {
                    if (/MTK.*/.test(linkedIssue.outwardIssue.key)) {
                        $issueCache[issueId].epics.push(linkedIssue.outwardIssue.key);
                    }
                }
            });
        }
    }

    function updateIssueVisualizationForIssueWithId(issueId) {
        if (shouldDrawEpicAreaOrIntegraAreaForIssue(issueId)) {
            prepareIssueWidget(issueId);
            drawAssociatedEpicsOnIssueWithId(issueId);
            drawIntegraOnIssueWithId(issueId);
        }
    }

    function shouldDrawEpicAreaOrIntegraAreaForIssue(issueId) {
        return shouldDrawEpicAreaForIssue(issueId) || shouldDrawIntegraAreaForIssue(issueId);
    }

    function shouldDrawEpicAreaForIssue(issueId) {
        return (issueId in $issueCache && $issueCache[issueId].epics.length > 0);
    }

    function shouldDrawIntegraAreaForIssue(issueId) {
        return (issueId in $issueCache && $issueCache[issueId].integra);
    }

    function prepareIssueWidget(issueId) {
        var issue = $("div#ghx-pool").find("[data-issue-key='" + issueId + "']");
        issue.height(140);
        issue.find(".ghx-grabber").height("100%");
    }

    function drawAssociatedEpicsOnIssueWithId(issueId) {
        if (!shouldDrawEpicAreaForIssue(issueId)) {
            return;
        }
        var issue = $("div#ghx-pool").find("[data-issue-key='" + issueId + "']");
        issue.find(".epics").remove();
        var divElement = $("<div class='epics sticky'>");
        divElement.appendTo(issue);
        $.each($issueCache[issueId].epics, function (counter, epic) {
            divElement.append('<a href="' + $baseUrl + '/browse/' + epic + '" target="_blank">' + epic + "</a><br/>");
        });
    }

    function drawIntegraOnIssueWithId(issueId) {
        if (!shouldDrawIntegraAreaForIssue(issueId)) {
            return;
        }
        var issue = $("div#ghx-pool").find("[data-issue-key='" + issueId + "']");
        issue.find(".integra").remove();
        var divElement = $("<div class='integra'>");
        divElement.appendTo(issue);
        divElement.append($("<h1 class='sticky'>Integra</h1>"));
        divElement.append($("<p class='sticky'>"+$issueCache[issueId].integra+"</p>"));
    }

    function setup() {
        var blueStickyCssPart = "background: url('data:image/png;base64,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');"
        var yellowStickyCssPart = "background: url('data:image/png;base64,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');";
        var css = ".epics {" + yellowStickyCssPart + "background-position: top left; background-size: contain; background-repeat: no-repeat; height: 75px; position: absolute; left: 0; width: 70px; padding: 17px 4px 2px 16px; z-index: 1}"+
            ".integra {" + blueStickyCssPart + "background-position: top left; background-size: contain; background-repeat: no-repeat; height: 75px; position: absolute; left: 73px; width: 70px; padding: 17px 4px 2px 16px; z-index: 1}"+
            ".sticky { font-size: 12px; margin-top: 0px};";
        $('head').append($('<style id="EpicsAndIntegrasStyle" data-enabled="false"></style>').html(css));
        $("#js-work-quickfilters").append('<dd><a role="button" id="' + FEATURE_BUTTON_ID + '" href="#" class="js-quickfilter-button ghx-active" title="Show Epics and Integras">Show Epics and Integras</a></dd>');
        getFeatureButton().on("click", function() {
            toggleFeatureStatus();
            refreshEnableFeatureButtonState();
            refresh();
        });
        refreshEnableFeatureButtonState();
    }

    function getFeatureButton() {
        return $("#" + FEATURE_BUTTON_ID);
    }

    function refreshEnableFeatureButtonState() {
        var button = getFeatureButton();
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