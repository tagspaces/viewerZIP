/* Copyright (c) 2013-2016 The TagSpaces Authors.
 * Use of this source code is governed by the MIT license which can be found in the LICENSE.txt file. */

/* globals marked */
"use strict";

var isCordova;
var isWin;
var isWeb;

var $htmlContent;

var JSZip;

$(document).ready(function () {
    function getParameterByName(name) {
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    var locale = getParameterByName("locale");

    var extSettings;
    loadExtSettings();

    isCordova = parent.isCordova;
    isWin = parent.isWin;
    isWeb = parent.isWeb;

    $(document).on('drop dragend dragenter dragover', function (event) {
        event.preventDefault();
    });

    $('#aboutExtensionModal').on('show.bs.modal', function () {
        $.ajax({
                url: 'README.md',
                type: 'GET'
            })
            .done(function (zipData) {
                //console.log("DATA: " + zipData);
                if (marked) {
                    var modalBody = $("#aboutExtensionModal .modal-body");
                    modalBody.html(marked(zipData, {sanitize: true}));
                    handleLinks(modalBody);
                } else {
                    console.log("markdown to html transformer not found");
                }
            })
            .fail(function (data) {
                console.warn("Loading file failed " + data);
            });
    });

    function handleLinks($element) {
        $element.find("a[href]").each(function () {
            var currentSrc = $(this).attr("href");
            $(this).bind('click', function (e) {
                e.preventDefault();
                var msg = {command: "openLinkExternally", link: currentSrc};
                window.parent.postMessage(JSON.stringify(msg), "*");
            });
        });
    }

    $htmlContent = $("#htmlContent");

    $("#printButton").on("click", function () {
        $(".dropdown-menu").dropdown('toggle');
        window.print();
    });

    if (isCordova) {
        $("#printButton").hide();
    }

    // Init internationalization
    $.i18n.init({
        ns: {namespaces: ['ns.viewerZIP']},
        debug: true,
        lng: locale,
        fallbackLng: 'en_US'
    }, function () {
        $('[data-i18n]').i18n();
    });

    function loadExtSettings() {
        extSettings = JSON.parse(localStorage.getItem("viewerZIPSettings"));
    }
});

var maxPreviewSize = (1024 * 3) || {}; //3kb limit for preview
function showContentFilePreviewDialog(containFile) {
    console.log("<------ Open Contain Files ------->");
    console.log(containFile);
    console.log("<------ End Contain Files ------->");
    var unitArr = containFile.asUint8Array();
    var previewText = "";
    var byteLength = (unitArr.byteLength > maxPreviewSize) ? maxPreviewSize : unitArr.byteLength;

    for (var i = 0; i < byteLength; i++) {
        previewText += String.fromCharCode(unitArr[i]);
    }

    var fileContent = $("<pre/>").text(previewText);
    var $htmlContent = $('#htmlContent');


    $.post("previewDialog.html", function(uiTPL){
        //console.log("Load modal " + uiTPL);
        if ($('#previewDialog').length < 1) {
            var uiTemplate = Handlebars.compile(uiTPL);
            console.debug(uiTemplate);
            $('body').append(uiTemplate());
        }
        var dialogPreview = $('#previewDialog');
        dialogPreview.find('.modal-body').empty().append(fileContent);
        dialogPreview.modal({
            backdrop: 'static',
            show: true
        });
    });

}

function setContent(content, fileDirectory) {
    var $htmlContent = $('#htmlContent');
    $htmlContent.append(content);
    //console.log("<---- Start main content ----->");
    //console.debug(content);
    //console.log("<---- End main content ----->");

    if (fileDirectory.indexOf("file://") === 0) {
        fileDirectory = fileDirectory.substring(("file://").length, fileDirectory.length);
    }

    $htmlContent.append('<div/>').css({
        'overflow': 'auto',
        'padding': '5px',
        'background-color': 'white',
        'fontSize': 12,
        'width': '100%',
        'height': '100%'
    });
    $htmlContent.append("<p><h4> Contents of file " + fileDirectory + "</h4></p>");
    var ulFiles = $htmlContent.append("<ul/>");
    var zipFile = content;
    //console.debug(zipFile);
    if (!!Object.keys(zipFile.files) &&
        typeof zipFile !== 'content' &&
        (typeof zipFile !== 'function' ||
        zipFile === null)) {
        for (var fileName in zipFile.files) {
            if (zipFile.files[fileName].dir === true) {
                continue;
            }
            var linkToFile = $('<a>').attr('href', '#').text(fileName);
            linkToFile.click(function (event) {
                event.preventDefault();
                var containFile = zipFile.files[$(this).text()];
                showContentFilePreviewDialog(containFile);
            });
            var liFile = $('<li/>').css('list-style-type', 'none').append(linkToFile);
            ulFiles.append(liFile);
        }
    } else {
        throw new TypeError("Object.keys called on non-object");
    }
}
