// ==UserScript==
// @name         EVW3226 UI Fix
// @namespace    https://github.com/gpgg
// @version      0.2
// @description  Adds hidden menus and fixes port-forwarding IP range check
// @author       GPGG
// @match        http://192.168.0.1/cgi-bin/setup.cgi?gonext=Rg*
// @grant        none
// ==/UserScript==

// returns only children of parameter element when nodeType is "node"
function getChildNodes(node) {
    var children = [];
    for (var child in node.childNodes) {
        // nodeType 1 is node
        if (node.childNodes[child].nodeType === 1) {
            children.push(node.childNodes[child]);
        }
    }
    return children;
}

// For example, if window.location.href is
// http://192.168.0.1/cgi-bin/setup.cgi?gonext=RgAdvancedOptions
// returns "RgAdvancedOptions"
function getGoNext() {
    var href = window.location.href,
        goNext;
    return href.replace(window.location.protocol + "//" + window.location.host + "/cgi-bin/setup.cgi?gonext=", "");
}

// appends newLi to menuUL before first-level menu with text "referenceLiString"
// only if text present in "newLi" is not present,
// if referenceListring is not found appends at the end
function appendFirstLevelMenuItem(menuUL, referenceLiString, newLi) {
    var menuChilds = getChildNodes(menuUL),
        present,
        currentLi,
        currentAnchor,
        newAnchor = getChildNodes(newLi)[0],
        referenceLi;
    for (var i = 0; i < menuChilds.length; i++) {
        if (menuChilds[i].tagName === "LI") {
            currentLi = menuChilds[i];
            // always first element of LI is Anchor
            currentAnchor = getChildNodes(currentLi)[0];
            if (currentAnchor.innerHTML === newAnchor.innerHTML) {
                present = true;
            } else if (currentAnchor.innerHTML === referenceLiString) {
                referenceLi = currentLi;
            }
        }
    }
    if (!present) {
        if (referenceLi.tagName !== "LI") { // if referenceLi not LI, append
            menuUL.appendChild(newLi);
        } else {
            menuUL.insertBefore(newLi, referenceLi);
        }
    }
}

// constructor for TopLevel menu
// this.li is a LI with an Anchor child with text "text" which links to "href"
function TopLevelMenu(text, href) {
    var newAnchor = document.createElement("a");
    var newLi = document.createElement("li");

    newAnchor.href = href;
    newAnchor.appendChild(document.createTextNode(text));
    newLi.appendChild(newAnchor);

    this.li = newLi;
}

// unordered list inside subnav menu
var sideMenu = document.getElementsByClassName("upc_subnav").item(0);

// fourth script element contains parameters we want to extract
var longScript = document.getElementsByTagName("script").item(3);
var extractedLANIP, extractedLANMASK;

// select which menus to add based on page
switch (getGoNext().match(/[A-Z][a-z]+/g, "")[1]) {
case "System":
    switchModeMenu = new TopLevelMenu("Switch Mode", "../cgi-bin/setup.cgi?gonext=RgSystemSwitchMode");
    appendFirstLevelMenuItem(sideMenu, "Backup and Recovery", switchModeMenu.li);

    break;
case "Advanced":
    dmzHostMenu = new TopLevelMenu("DMZ Host", "../cgi-bin/setup.cgi?gonext=RgAdvancedDmzHost");
    appendFirstLevelMenuItem(sideMenu, "Firewall", dmzHostMenu.li);

    portTriggersMenu = new TopLevelMenu("Port Triggers", "../cgi-bin/setup.cgi?gonext=RgAdvancedPortTriggers");
    appendFirstLevelMenuItem(sideMenu, "DMZ Host", portTriggersMenu.li);

    forwardingMenu = new TopLevelMenu("Forwarding", "../cgi-bin/setup.cgi?gonext=RgAdvancedForwarding");
    appendFirstLevelMenuItem(sideMenu, "Port Triggers", forwardingMenu.li);


    portFiltersMenu = new TopLevelMenu("Port Filters", "../cgi-bin/setup.cgi?gonext=RgAdvancedPortFilters");
    appendFirstLevelMenuItem(sideMenu, "Forwarding", portFiltersMenu.li);

    break;
}

// option-specific options
switch (getGoNext()) {
    case "RgAdvancedForwarding":
        extractedLANIP = longScript.innerHTML.match(/var LANIP.*/)[0].match(/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/)[0];
        extractedLANMASK = longScript.innerHTML.match(/var LANMASK.*/)[0].match(/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/)[0];

        // replace AddForwarding list with version that doesn't check start/end IP
        AddForwardingList = function () {
            var i;
            var PublicPortRange;
            var TargetPortRange;
            var PublicPortRangeArray;
            var TargetPortRangeArray;
            var LANIP = extractedLANIP;
            var LANMASK = extractedLANMASK;
            var LANIPArray = LANIP.split(".");
            var LANMASKArray = LANMASK.split(".");
            var TargetIPAddr;
            var TargetIPAddrArray;
            var Protocol;

            //check
            for (i = 0; i < row; i++) {
                PublicPortRange = getElement("PublicPortRangeText" + i).value;
                TargetPortRange = getElement("TargetPortRangeText" + i).value;
                PublicPortRangeArray = PublicPortRange.split("-");
                TargetPortRangeArray = TargetPortRange.split("-");
                TargetIPAddr = getElement("TargetIPAddrText" + i).value;
                TargetIPAddrArray = TargetIPAddr.split(".");

                if (PublicPortRangeArray.length <= 2 && TargetPortRangeArray.length <= 2) {
                    if (PublicPortRangeArray.length == 1) {
                        PublicPortRangeArray[1] = PublicPortRangeArray[0];
                        PublicPortRange = PublicPortRangeArray[0] + '-' + PublicPortRangeArray[1];
                    }

                    if (TargetPortRangeArray.length == 1) {
                        TargetPortRangeArray[1] = TargetPortRangeArray[0];
                        TargetPortRange = TargetPortRangeArray[0] + '-' + TargetPortRangeArray[1];
                    }

                    for (j = 0; j < 2; j++) {
                        if (isNumber(PublicPortRangeArray[j])
                          || isNumber(TargetPortRangeArray[j])) {
                            if (parseInt(TargetPortRangeArray[j]) > 65535 || parseInt(TargetPortRangeArray[j]) <= 0 ||
                              parseInt(PublicPortRangeArray[j]) > 65535 || parseInt(PublicPortRangeArray[j]) <= 0) {
                                //Port should be between 1 and 65535
                                myalert("" + ErrArray[2] + "");
                                return false;
                            } else {
                                getElement("PublicPortRangeText" + i).value
                                  = PublicPortRange;
                                getElement("TargetPortRangeText" + i).value
                                  = TargetPortRange;
                            }
                        } else {
                            myalert("" + ErrArray[1] + ""); //Invalid port range, please enter again
                            return false;
                        }
                    }
                } else {
                    myalert("" + ErrArray[1] + ""); //Invalid port range, please enter again
                    return false;
                }

                if (isValidIpAddress(TargetIPAddr) == false) {
                    myalert("" + ErrArray[3] + ""); //Invalid IP address. Please enter it again
                    return false;
                }

                if (((parseInt(LANIPArray[0]) & parseInt(LANMASKArray[0])) == (parseInt(TargetIPAddrArray[0]) & parseInt(LANMASKArray[0]))) &&
                  ((parseInt(LANIPArray[1]) & parseInt(LANMASKArray[1])) == (parseInt(TargetIPAddrArray[1]) & parseInt(LANMASKArray[1]))) &&
                  ((parseInt(LANIPArray[2]) & parseInt(LANMASKArray[2])) == (parseInt(TargetIPAddrArray[2]) & parseInt(LANMASKArray[2]))) &&
                  (parseInt(TargetIPAddrArray[3]) != parseInt(LANIPArray[3]))) {
                } else {
                    //This IP address should be in the same subnet
                    //as the LAN IP address
                    myalert("" + ErrArray[4] + "");
                    return false;
                }

                if (parseInt(PublicPortRangeArray[0]) > parseInt(PublicPortRangeArray[1])) {
                    var temp;
                    temp = PublicPortRangeArray[0];
                    PublicPortRangeArray[0] = PublicPortRangeArray[1];
                    PublicPortRangeArray[1] = temp;
                    PublicPortRange = PublicPortRangeArray[0] + "-" + PublicPortRangeArray[1];
                    getElement("PublicPortRangeText" + i).value = PublicPortRange;
                }

                if (parseInt(TargetPortRangeArray[0]) > parseInt(TargetPortRangeArray[1])) {
                    var temp;
                    temp = TargetPortRangeArray[0];
                    TargetPortRangeArray[0] = TargetPortRangeArray[1];
                    TargetPortRangeArray[1] = temp;
                    TargetPortRange = TargetPortRangeArray[0] + "-" + TargetPortRangeArray[1];
                    getElement("TargetPortRangeText" + i).value = TargetPortRange;
                }

                if ((parseInt(PublicPortRangeArray[1]) - parseInt(PublicPortRangeArray[0])) !=
                  (parseInt(TargetPortRangeArray[1]) - parseInt(TargetPortRangeArray[0]))) {
                    myalert("" + ErrArray[0] + ""); //Use the same port range for Internal port
                    return false;
                }

                if ((parseInt(PublicPortRangeArray[1]) - parseInt(PublicPortRangeArray[0])) > 100 ||
                  (parseInt(TargetPortRangeArray[1]) - parseInt(TargetPortRangeArray[0])) > 100) {
                    myalert("" + ErrArray[7] + "");
                    return false;
                }
            }

            for (i = 0; i < row; i++) {
                PublicPortRange = getElement("PublicPortRangeText" + i).value;
                TargetPortRange = getElement("TargetPortRangeText" + i).value;
                PublicPortRangeArray = PublicPortRange.split("-");
                TargetPortRangeArray = TargetPortRange.split("-");
                for (j = i + 1; j < row; j++) {
                    var OtherTriggerPortRange = getValue("PublicPortRangeText" + j);
                    var OtherTargetPortRange = getValue("TargetPortRangeText" + j);
                    var OtherTriggerPortRangeArray = OtherTriggerPortRange.split("-");
                    var OtherTargetPortRangeArray = OtherTargetPortRange.split("-");
                    if ((parseInt(OtherTriggerPortRangeArray[0]) <= parseInt(PublicPortRangeArray[0]) && parseInt(PublicPortRangeArray[0]) <= parseInt(OtherTriggerPortRangeArray[1])) ||
                        (parseInt(OtherTriggerPortRangeArray[0]) <= parseInt(PublicPortRangeArray[1]) && parseInt(PublicPortRangeArray[1]) <= parseInt(OtherTriggerPortRangeArray[1])) ||
                        (parseInt(PublicPortRangeArray[0]) <= parseInt(OtherTriggerPortRangeArray[0]) && parseInt(OtherTriggerPortRangeArray[1]) <= parseInt(PublicPortRangeArray[1])) ||
                        (parseInt(OtherTargetPortRangeArray[0]) <= parseInt(TargetPortRangeArray[0]) && parseInt(TargetPortRangeArray[0]) <= parseInt(OtherTargetPortRangeArray[1])) ||
                        (parseInt(OtherTargetPortRangeArray[0]) <= parseInt(TargetPortRangeArray[1]) && parseInt(TargetPortRangeArray[1]) <= parseInt(OtherTargetPortRangeArray[1])) ||
                        (parseInt(TargetPortRangeArray[0]) <= parseInt(OtherTargetPortRangeArray[0]) && parseInt(OtherTargetPortRangeArray[1]) <= parseInt(TargetPortRangeArray[1]))) {
                        myalert("" + ErrArray[6] + ""); //Inbound connection port range overlap with other services
                        return false;
                    }
                }
            }

            //save
            var textflag = new Array(row);
            var hiddenflag = new Array(16);
            for (i = 0; i < 16; i++)
                hiddenflag[i] = 0;

            //label
            for (i = 0; i < row; i++) {
                textflag[i] = 0;
                PublicPortRange = getElement("PublicPortRangeText" + i).value;
                TargetPortRange = getElement("TargetPortRangeText" + i).value;
                TargetIPAddr = getElement("TargetIPAddrText" + i).value;
                Protocol = getElement("ProtocolSelect" + i).value;
                //if find a matched IP and label, next loop it will not be written
                for (j = 0; j < 16; j++) {
                    if (hiddenflag[j] == 0) {
                        if ((PublicPortRange == getElement("RgPublicPortRange" + j).value) &&
                            (TargetPortRange == getElement("RgTargetPortRange" + j).value) &&
                            (TargetIPAddr == getElement("RgTargetIPAddress" + j).value) &&
                            (Protocol == getElement("RgProtocol" + j).value)) {
                            textflag[i] = 1;
                            hiddenflag[j] = 1;
                            break;
                        }
                    }
                }
            }

            //write the unlabeled rows
            for (i = 0; i < row; i++) {
                if (textflag[i] == 0) {
                    PublicPortRange = getElement("PublicPortRangeText" + i).value;
                    TargetPortRange = getElement("TargetPortRangeText" + i).value;
                    TargetIPAddr = getElement("TargetIPAddrText" + i).value;
                    Protocol = getElement("ProtocolSelect" + i).value;
                    for (j = 0; j < 16; j++) {
                        //find empty or unwritten
                        if (getElement("RgPublicPortRange" + j).value == "0" || hiddenflag[j] == 0) {
                            getElement("RgEnable" + j).value = 1;
                            getElement("RgPublicPortRange" + j).value = PublicPortRange;
                            getElement("RgTargetPortRange" + j).value = TargetPortRange;
                            getElement("RgTargetIPAddress" + j).value = TargetIPAddr;
                            getElement("RgProtocol" + j).value = Protocol;
                            getElement("RgDelete" + j).value = 0;
                            textflag[i] = 1;
                            hiddenflag[j] = 1;
                            break;
                        }
                    }
                }
            }

            return true;
        }
        break;
}
