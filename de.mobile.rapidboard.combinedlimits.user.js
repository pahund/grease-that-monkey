// ==UserScript==
// @name Jira Rapid Board combined limits
// @namespace Jira
// @include https://jira.corp.mobile.de/jira/secure/RapidBoard.jspa*
// @version 4
// @grant none
// ==/UserScript==
(function jiraRapidBoardCombinedLimits($) {

    function refreshLimits() {
        var groups = {};
        var classesForColumns = {};
        var $header = $('ul#ghx-column-headers');
        $header.find('li.ghx-column').each(function() {
            min = 0;
            var $column = $(this);
            $column.removeClass("ghx-busted ghx-busted-max");
            var groupKey = $column.children('h2').text().split(/ /)[0];
            var min = parseInt($('.ghx-limits .ghx-busted-min', $column).text().replace(/Min[^ ]* /, ""));
            var max = parseInt($('.ghx-limits .ghx-busted-max', $column).text().replace(/Max[^ ]* /, ""));
            var current = parseInt($('.ghx-qty', $column).text());

            if (!groups[groupKey]) {
                groups[groupKey] = {
                    $columns: $(),
                    current: 0
                };
            }

            var group = groups[groupKey];
            group.$columns = group.$columns.add($column);
            if (min) group.min = group.min ? group.min + min : min;
            if (max) group.max = group.max ? group.max + max : max;
            group.current = group.current + current;
        });

        for (var groupKey in groups) {
            var group = groups[groupKey];

            var $limit = $('<div class="ghx-x-limit-combined"></div>');
            if (group.current && group.max) {
                $limit.text('Combined: ' + group.current + ' of ' + group.max);

                var addClass = null;
                if (group.current == group.max) addClass = 'ghx-x-limit-warning';
                if (group.current > group.max) addClass = 'ghx-x-limit-fail';

                group.$columns.each(function() {
                    classesForColumns[$(this).data().id] = addClass;
                });
            }

            group.$columns.children('.ghx-x-limit-combined').remove();
            group.$columns.append($limit);
        }

        $('#ghx-pool .ghx-swimlane .ghx-column').each(function() {
            var $cell = $(this);
            group.$columns.removeClass("ghx-x-limit-warning ghx-x-limit-fail");
            $cell.addClass(classesForColumns[$cell.data().columnId]).removeClass("ghx-busted ghx-busted-max");
        });
    }

    $(function() {
        var css = ".ghx-column.ghx-x-limit-warning { background-color: gold; } " + ".ghx-column.ghx-x-limit-fail { background-color: crimson; } " + ".ghx-x-limit-combined { position: absolute; bottom: 0; font-size: 11px; color: #707070 }";
        $('head').append($('<style></style>').html(css))

        refreshLimits();

        var handlerActive = false;
        $("#ghx-pool").live("DOMNodeInserted", function(event) {
            var $this = $(event.target);
            if ($this.closest('#ghx-column-header-group').length > 0 && !handlerActive) {
                handlerActive = true;
                refreshLimits();
                handlerActive = false;
            }
        });

    });

}(jQuery));
