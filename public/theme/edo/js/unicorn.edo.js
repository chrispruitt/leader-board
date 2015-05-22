/**
 * fnReloadAjax -> function for datatables that allows us to reload data from the controller on demand
 */
$.fn.dataTableExt.oApi.fnReloadAjax = function(oSettings, sNewSource, fnCallback) {
    if (typeof sNewSource !== 'undefined') {
        oSettings.sAjaxSource = sNewSource;
    }
    this.oApi._fnProcessingDisplay(oSettings, true);
    var that = this;

    oSettings.fnServerData(oSettings.sAjaxSource, null, function(json) {
        /* Clear the old information from the table */
        that.oApi._fnClearTable( oSettings );

        /* Got the data - add it to the table */
        for ( var i=0 ; i<json.aaData.length ; i++ ){
            that.oApi._fnAddData( oSettings, json.aaData[i] );
        }

        oSettings.aiDisplay = oSettings.aiDisplayMaster.slice();
        that.fnDraw( that );
        that.oApi._fnProcessingDisplay( oSettings, false );

        /* Callback user function - for event handlers etc */
        if ( typeof fnCallback === 'function' ){
            fnCallback( oSettings );
        }
    });
};

/**
 * fnGetColumnData -> function for datatables that gives an array of column data when called
 */
jQuery.fn.dataTableExt.oApi.fnGetColumnData = function ( oSettings, iColumn, bUnique, bFiltered, bIgnoreEmpty ) {
    // check that we have a column id
    if ( typeof iColumn === "undefined" ) return [];

    // by default we do NOT only want unique data
    if ( typeof bUnique === "undefined" ) bUnique = false;

    // by default we do want to only look at filtered data
    if ( typeof bFiltered === "undefined" ) bFiltered = true;

    // by default we do want to include empty values
    if ( typeof bIgnoreEmpty === "undefined" ) bIgnoreEmpty = false;

    // list of rows which we're going to loop through
    var aiRows;

    // use only filtered rows
    if (bFiltered == true) aiRows = oSettings.aiDisplay;
    // use all rows
    else aiRows = oSettings.aiDisplayMaster; // all row numbers

    // set up data array
    var asResultData = [];

    for (var i=0,c=aiRows.length; i<c; i++) {
        var iRow = aiRows[i];
        var sValue = this.fnGetData(iRow, iColumn);

        // ignore empty values?
        if (bIgnoreEmpty === true && sValue.length === 0) continue;

        // ignore unique values?
        else if (bUnique === true && jQuery.inArray(sValue, asResultData) > -1) continue;

        // else push the value onto the result data array
        else asResultData.push(sValue);
    }

    return asResultData;
};

$.fn.dataTableExt.oApi.fnGetColumnIndexByDataField = function ( oSettings, sCol )
{
    var cols = oSettings.aoColumns;
    for ( var x=0, xLen=cols.length ; x<xLen ; x++ )
    {
        if ( cols[x].mData.toLowerCase() === sCol.toLowerCase() )
        {
            return x;
        }
    }
    return -1;
};

$.extend($.fn.dataTable.defaults, {
    "bJQueryUI": true,
    "sPaginationType": "full_numbers",
    "sDom": '<""l>t<"F"fp>',
    "bDeferRender": true
});

$.extend($.fn.select2.defaults, {
    minimumResultsForSearch: 10,
    formatSelection: function(item, container) {
        if (item.disabled) {
            container.parent().addClass("select2-disabled");
            container.html(item.text + " (disabled)");
        } else {
            container.html(item.text);
        }
    },
    formatResult: function(item) {
        if (item.disabled) {
            return item.text + " (disabled)";
        }
        return item.text;
    }
});

if (typeof $.jstree !== "undefined") {
    $.jstree.defaults.core.check_callback = true;
}

$.EventBus("initializeWidgets").subscribe(function(root) {
    root = edo.util.getElement(root || "body");

    root.find("select:not(.select2-ignore)").select2();

    if (typeof $.uniform !== "undefined") {
        root.find("input[type=checkbox],input[type=radio],input[type=file]").uniform();

        root.find("span.icon input:checkbox, th input:checkbox").click(function() {
            var checkedStatus = this.checked;
            var checkbox = $(this).parents('.widget-box').find('tr td:first-child input:checkbox');
            checkbox.each(function() {
                this.checked = checkedStatus;
                if (checkedStatus == this.checked) {
                    $(this).closest('.checker > span').removeClass('checked');
                }
                if (this.checked) {
                    $(this).closest('.checker > span').addClass('checked');
                }
            });
        });
    }
});

$(document).ready(function(){
    $('.data-table').dataTable();
    $.EventBus("initializeWidgets").publish();
});
