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

    var styles = ['', 'solarized-dark', 'github', 'metro-vibes', 'clearness', 'clearness-dark'];
    var currentStyleIndex = 0;
    if (extSettings && extSettings.styleIndex) {
        currentStyleIndex = extSettings.styleIndex;
    }

    $htmlContent.removeClass();
    $htmlContent.addClass('markdown ' + styles[currentStyleIndex]);

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

    var maxPreviewSize = (1024 * 3) || {}; //3kb limit for preview
    //function showContentFilePreviewDialog(containFile) {
    //    var unitArr = containFile.asUint8Array();
    //    var previewText = "";
    //    var byteLength = (unitArr.byteLength > maxPreviewSize) ? maxPreviewSize : unitArr.byteLength;
    //
    //    for (var i = 0; i < byteLength; i++) {
    //        previewText += String.fromCharCode(unitArr[i]);
    //    }
    //
    //    var fileContent = $("<pre/>").text(previewText);
    //    require(['text!' + extensionDirectory + '/previewDialog.html'], function (uiTPL) {
    //
    //        if ($('#previewDialog').length < 1) {
    //            var uiTemplate = Handlebars.compile(uiTPL);
    //            $('body').append(uiTemplate());
    //        }
    //        var dialogPreview = $('#previewDialog');
    //        dialogPreview.find('.modal-body').empty().append(fileContent);
    //        dialogPreview.modal({
    //            backdrop: 'static',
    //            show: true
    //        });
    //    });
    //}
});

function setContent(content, fileDirectory) {
    var $htmlContent = $('#htmlContent');
    $htmlContent.append(content);
    console.log("SET ZIP VIEWER CONTENT : " + content);

    var zip = new JSZip(content);
    zip.file(content, fileDirectory);
    console.log("ZIP FILE : " + zip.file());

    $("base").attr("href", fileDirectory + "//");

    if (fileDirectory.indexOf("file://") === 0) {
        fileDirectory = fileDirectory.substring(("file://").length, fileDirectory.length);
    }

    var hasURLProtocol = function(url) {
        return (
            url.indexOf("http://") === 0 ||
            url.indexOf("https://") === 0 ||
            url.indexOf("file://") === 0 ||
            url.indexOf("data:") === 0
        );
    };

    // fixing embedding of local images
    $htmlContent.find("img[src]").each(function() {
        var currentSrc = $(this).attr("src");
        if (!hasURLProtocol(currentSrc)) {
            var path = (isWeb ? "" : "file://") + fileDirectory + "/" + currentSrc;
            $(this).attr("src", path);
        }
    });

    $htmlContent.find("a[href]").each(function() {
        var currentSrc = $(this).attr("href");
        var path;

        if (!hasURLProtocol(currentSrc)) {
            var path = (isWeb ? "" : "file://") + fileDirectory + "/" + currentSrc;
            $(this).attr("href", path);
        }

        $(this).bind('click', function(e) {
            e.preventDefault();
            if (path) {
                currentSrc = encodeURIComponent(path);
            }
            var msg = {command: "openLinkExternally", link : currentSrc};
            window.parent.postMessage(JSON.stringify(msg), "*");
        });
    });
}
