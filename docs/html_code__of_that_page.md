<html xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="description"><meta name="author" content="Dashboard"><meta name="keyword" content="Dashboard, Bootstrap, Admin, Template, Theme, Responsive, Fluid, Retina"><title>
	Current Work Load
</title><link rel="stylesheet" href="Desh.css" type="text/css">   
  <!-- Favicons -->
 
 


     <link rel="icon" type="image/png" href="Master%20Page/favicon.ico">

   

  <!-- Bootstrap core CSS -->
  <link href="lib/bootstrap/css/bootstrap.min.css" rel="stylesheet">
  <!--external css-->
  <link href="lib/font-awesome/css/font-awesome.css" rel="stylesheet"><link rel="stylesheet" type="text/css" href="css/zabuto_calendar.css"><link rel="stylesheet" type="text/css" href="lib/gritter/css/jquery.gritter.css">
  <!-- Custom styles for this template -->
  <link href="css/style.css" rel="stylesheet"><link href="css/style-responsive.css" rel="stylesheet">
  <script src="../lib/chart-master/Chart.js"></script>

  <!-- =======================================================
    Template Name: Dashio
    Template URL: https://templatemag.com/dashio-bootstrap-admin-template/
    Author: TemplateMag.com
    License: https://templatemag.com/license/
  ======================================================= -->
  <style>
  body{
    margin-top: 0px; margin-bottom: 0px; margin-left: 0px; margin-right: 0px;
    padding: 0;
    color: black; font-size: 10pt; font-family: "Trebuchet MS", sans-serif;
    background-color: #FFFFFF; overflow-x: hidden;}
  

* {
  box-sizing: border-box;
}


      .lk {

          color: #3e4b5b;
          float: left;
          margin-top: 2px;
          margin-left: -15px;
          height:50px;
          width:180px;
          /*text-transform: uppercase;*/

      }
img {
  vertical-align: middle;
}

/* Position the image container (needed to position the left and right arrows) */
.container {
  position: relative;
}

/* Hide the images by default */
.mySlides {
  display: none;
}

/* Add a pointer when hovering over the thumbnail images */
.cursor {
  cursor: pointer;
}

/* Next & previous buttons */
.prev,
.next {
  cursor: pointer;
  position: absolute;
  top: 120%;
  width: auto;
  padding: 16px;
  margin-top: -50px;
  color: white;
  font-weight: bold;
  font-size: 20px;
  border-radius: 0 3px 3px 0;
  user-select: none;
  -webkit-user-select: none;
}

/* Position the "next button" to the right */
.next {
  right: 0;
  border-radius: 3px 0 0 3px;
}

/* On hover, add a black background color with a little bit see-through */
.prev:hover,
.next:hover {
  background-color: rgba(0, 0, 0, 0.8);
}

/* Number text (1/3 etc) */
.numbertext {
  color: #f2f2f2;
  font-size: 12px;
  padding: 2px 12px;
  position: absolute;
  top: 0;
}

/* Container for image text */
.caption-container {
  text-align: center;
  background-color: #222;
  padding: 2px 16px;
  color: white;
}

.row:after {
  content: "";
  display: table;
  clear: both;
}

/* Six columns side by side */
.column {
  float: left;
  width: 16.66%;
}

/* Add a transparency effect for thumnbail images */
.demo {
  opacity: 0.6;
}

.active,
.demo:hover {
  opacity: 1;
}

#noti_Container {
            ; /* This is crucial for the absolutely positioned element */
            width: 16px;
            height: 16px;
        }

        .noti_bubble {
            ; /* This breaks the div from the normal HTML document. */
            top: -6px;
            right: -6px;
            padding: 1px 2px 1px 2px;
            background-color: red; /* you could use a background image if you'd like as well */
            color: white;
            font-weight: bold;
            font-size: 0.55em;
            /* The following is CSS3, but isn't crucial for this technique to work. */
            /* Keep in mind that if a browser doesn't support CSS3, it's fine! They just won't have rounded borders and won't have a box shadow effect. */
            /* You can always use a background image to produce the same effect if you want to, and you can use both together so browsers without CSS3 still have the rounded/shadow look. */
            border-radius: 30px;
            box-shadow: 1px 1px 1px gray;
        }
</style>



     <script type="text/javascript">
         //function zoom() {
         //    document.body.style.zoom = "300%"
         //}

         window.onload = function zoom() {
             //document.getElementById('kk1').click();
             document.body.style.zoom = "90%"

         }
</script>
 <script>
let slideIndex = 1;
showSlides(slideIndex);

function plusSlides(n) {
  showSlides(slideIndex += n);
}

function currentSlide(n) {
  showSlides(slideIndex = n);
}

function showSlides(n) {
  let i;
  let slides = document.getElementsByClassName("mySlides");
  let dots = document.getElementsByClassName("demo");
  let captionText = document.getElementById("caption");
  if (n > slides.length) {slideIndex = 1}
  if (n < 1) {slideIndex = slides.length}
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }
  slides[slideIndex-1].style.display = "block";
  dots[slideIndex-1].className += " active";
  captionText.innerHTML = dots[slideIndex-1].alt;
}



</script>
    

  
<style type="text/css">.jqstooltip { position: absolute;left: 0px;top: 0px;display: block;visibility: hidden;background: rgb(0, 0, 0) transparent;background-color: rgba(0,0,0,0.6);filter:progid:DXImageTransform.Microsoft.gradient(startColorstr=#99000000, endColorstr=#99000000);-ms-filter: "progid:DXImageTransform.Microsoft.gradient(startColorstr=#99000000, endColorstr=#99000000)";color: white;font: 10px arial, san serif;text-align: left;white-space: nowrap;border: 1px solid white;z-index: 10000;}.jqsfield { color: white;padding: 5px 5px 8px 5px;font: 10px arial, san serif;text-align: left;}</style></head>

<body onload="showSlides(1)" style="background-color: rgb(223, 221, 247); zoom: 90%;">
<form method="post" action="./Current_Work.aspx" id="Form1">
<div class="aspNetHidden">
<input type="hidden" name="__EVENTTARGET" id="__EVENTTARGET" value="">
<input type="hidden" name="__EVENTARGUMENT" id="__EVENTARGUMENT" value="">
<input type="hidden" name="__VIEWSTATE" id="__VIEWSTATE" value="/wEPDwUJMzQ2MzcyMTk0D2QWAmYPZBYCAgMPZBYIAgcPDxYCHgRUZXh0BRVXRUxDT01FIDogV09SSzY4MDA5NzJkZAILDxYCHgdWaXNpYmxlaGQCEw8WBB4EaHJlZgUfQWdnLmFzcHg/Q29kZD0xMDk0NCZOYW09S2F1c2hhbB8BaGQCGQ9kFgQCAQ9kFgICAQ8WAh4Dc3JjBTFET0NfVVBMT0FELzcuanBnI3Rvb2xiYXI9MCZuYXZwYW5lcz0wJnNjcm9sbGJhcj0wZAIDDw8WAh8ABQtGb3JtIE5vIDogN2RkZKbkCH9kxYnTkKtw/EvmoYS+R0KU">
</div>

<script type="text/javascript">
//<![CDATA[
var theForm = document.forms['Form1'];
if (!theForm) {
    theForm = document.Form1;
}
function __doPostBack(eventTarget, eventArgument) {
    if (!theForm.onsubmit || (theForm.onsubmit() != false)) {
        theForm.__EVENTTARGET.value = eventTarget;
        theForm.__EVENTARGUMENT.value = eventArgument;
        theForm.submit();
    }
}
//]]>
</script>


<script src="/WebResource.axd?d=TQmU67J2vViNJzKw6WgDQn8QdufIJA_RUnbEAXZBvpk2Md3PW4QQU7L2CrtMBQXYp2UWGEhM5gzguwdJEkCuXPURl4g1&amp;t=638901536248157332" type="text/javascript"></script>


<script src="/ScriptResource.axd?d=U0zQ9vJ_Y5WTy9L7convmPoMgClsZayvEX7jFPGLOURUD7Tf5amPg8qlqWtrBxOApolAIUw2wvYdyRJCwI1aDCuB522vXvyEuR5bW38JM2URXv60G9m2LJEHUhiQM5eqKttFiPoD-Mc5O8wMeFqgXSOVQT9cDHLz0_h8I_fain6H7vl20&amp;t=5c0e0825" type="text/javascript"></script>
<script type="text/javascript">
//<![CDATA[
if (typeof(Sys) === 'undefined') throw new Error('ASP.NET Ajax client-side framework failed to load.');
//]]>
</script>

<script src="/ScriptResource.axd?d=HjicZ13jY8gYBinz-KQ0nKvyD6SjJZEY76J05XAdx4flMMTTspSWW5mZGjFMEzD3Zci66cgAN96ObCRsfBHL72L6AU6xIajBbA7Oc14LMa35cSDAno-agKJvgh3AvuoXFOpud6KmHj-Tv8TmqAQuricrkIfaYTnpAuPP0U-ObTHWgsyxx6KFAB9IkiSC8r8501UjmQ2&amp;t=5c0e0825" type="text/javascript"></script>
<div class="aspNetHidden">

	<input type="hidden" name="__VIEWSTATEGENERATOR" id="__VIEWSTATEGENERATOR" value="BDF92570">
</div>
  <section id="container">
    <!-- **********************************************************************************************************************************************************
        TOP BAR CONTENT & NOTIFICATIONS
        *********************************************************************************************************************************************************** -->
    <!--header start-->
    <header class="header black-bg">
      <div class="sidebar-toggle-box">
        <div class="fa fa-bars tooltips" data-placement="right" data-original-title="Toggle Navigation"></div>
      </div>
      <!--logo start-->
    <img src="Image/logo2.png" class="lk" alt="Avatar">
      <!--logo end-->
      <div class="nav notify-row" id="top_menu">
        <!--  notification start -->
        <ul class="nav top-menu">
          <!-- settings start -->
          <li class="dropdown">
            
            <ul class="dropdown-menu extended tasks-bar">
              <div class="notify-arrow notify-arrow-green"></div>
              <li>
              
              </li>
            </ul>
          </li>
          <!-- settings end -->
          <!-- inbox dropdown start-->
          <li id="header_inbox_bar" class="dropdown">
           
            <ul class="dropdown-menu extended inbox">
              <div class="notify-arrow notify-arrow-green"></div>
              <li>
                
              </li>
            </ul>
          </li>
          <!-- inbox dropdown end -->
          <!-- notification dropdown start-->
          <li id="header_notification_bar" class="dropdown">

         

              
  
            <ul class="dropdown-menu extended notification">
              <div class="notify-arrow notify-arrow-yellow"></div>
              <li>
               
              </li>
            </ul>
          </li>
          <!-- notification dropdown end -->
        </ul>
        <!--  notification end -->
      </div>
      <div class="top-menu">
        <ul class="nav pull-right top-menu">
        
        
                    
          <li><input type="button" name="ctl00$ImgChngPass0" value="Logout" onclick="javascript:__doPostBack('ctl00$ImgChngPass0','')" id="ImgChngPass0" class="logout">
            &nbsp;&nbsp;
            
           </li><li> </li>
            
        </ul>
      </div>
    </header>
    <!--header end-->
    <!-- **********************************************************************************************************************************************************
        MAIN SIDEBAR MENU
        *********************************************************************************************************************************************************** -->
    <!--sidebar start-->
    <aside>
      <div id="sidebar" class="nav-collapse " tabindex="5000" style="overflow: hidden; outline: currentcolor;">
        <!-- sidebar menu start-->
        <ul class="sidebar-menu" id="nav-accordion">
          
            <p class="centered"><a href=""><img src="Image/face288.png" id="ImgYY" class="img-circle" width="100" style="border-radius:5px;"></a></p>
          <h5 class="centered"><span id="lblUID">WELCOME : WORK6800972</span> <br>
           </h5>
          <li class="mt">
            <a class="active" href="../Index.aspx">
              <i class="fa fa-dashboard"></i>
              <span>Dashboard</span>  
                          </a>
          </li>


            <li class="sub-menu">
            
          </li>
              
            <li class="sub-menu">
            <a href="Current_Work.aspx" id="A1">
              <i class="fa fa-book"></i>
              <span>Current Work Load</span>
              </a>
          </li>

            <li class="sub-menu">
            <a href="Enq.aspx?qw=0" id="A2">
              <i class="fa fa-book"></i>
              <span>Save Form</span>
              </a>
          </li>

              <li class="sub-menu">
            <a href="Enq.aspx?qw=1" id="A3">
              <i class="fa fa-book"></i>
              <span>Submit Form</span>
              </a>
          </li>




		 
		<li class="sub-menu">
            
          </li>
          
             

                 <li class="sub-menu">
            <a href="Agreement_List.aspx" id="ag2">
              <i class="fa fa-book"></i>
              <span>Agreement</span>
              </a>
          </li>

           <li class="sub-menu">
            <a href="Login.aspx" id="Student_Status">
              <i class="fa fa-book"></i>
              <span>Logout</span>
              </a>
          </li>


           

          
          
        </ul>
        <!-- sidebar menu end-->
      </div>
    </aside>
    <!--sidebar end-->
    <!-- **********************************************************************************************************************************************************
        MAIN CONTENT
        
        
        
        
        
        *********************************************************************************************************************************************************** -->
        
        <section id="main-content">
      <section class="wrapper">
        <div class="row">
          <div class="col-lg-9 main-chart">
            <!--CUSTOM CHART START -->
            
         <center>
    
      
     <link href="css/stylebox33.css" rel="stylesheet">
      <link href="kk.css" rel="stylesheet" type="text/css">
        <style>

        


.leb {
    display: block;
    width: 100%;
    height: 34px;
    padding: 6px 12px;
    font-size: 14px;
    line-height: 1.42857143;
    color: #555;
    background-color: #fff;
    background-image: none;
  
}


input[type=text] {
  width: 20%;
  position:relative;
  padding: 12px 20px;
  padding-left:10px;

  margin: 8px 0;
  box-sizing: border-box;
  border: none;
 border: 1px solid #ccc;
 font-size: 1.13rem;
}



/*.input {
           width: 100%;
            padding: 12px 20px;
            margin: 8px 0;
            display: inline-block;
            border: 1px solid #ccc;
            box-sizing: border-box;
            margin-top:-20px;
            padding-bottom:20px;
           font-family:"ubuntu-bold", sans-serif;
            font-size: 1.13rem;


     }
  
        .input:focus {
    outline: none !important;
    border:1px solid #201A64;
    box-shadow: 0 0 10px #201A64;
  }*/
   

.iframe{
  width: 80%;
 /*height:300px;*/
  position:relative;
  padding: 12px 20px;
  padding-left:0px;

  margin: 8px 0;
  box-sizing: border-box;
  /*border: 2px solid green;*/
  /*border-bottom: 2px solid green;*/
 
}


/*.button {
  display: inline-block;
  padding: 5px 25px;
  font-size: 15px;
  cursor: pointer;
  text-align: center;
  text-decoration: none;
  outline: none;
  color: #fff;
  background-color: #4CAF50;
  border: none;
  border-radius: 15px;
  
}




.button:hover {background-color: #3e8e41}

.button:active {

  transform: translateY(4px);
}*/



.button {
            background: linear-gradient(to right, #5F55D2, #201A64);
            color: white;
            padding: 14px 10px;
            margin: 8px 0;
            border: none;
            cursor: pointer;
            width: 10%;
            min-width:15%;
            font-family:"ubuntu-bold", sans-serif;
            font-size:1.2rem;
        }

            .button:hover {
                opacity: 0.8;
            }
        </style>   
     
    <script type="text/javascript">
        //function zoom() {
        //    document.body.style.zoom = "300%"
        //}

        window.onload = function zoom() {
            //document.getElementById('kk1').click();
            document.body.style.zoom = "90%"

        }

        
     

     
       


</script>  
   



    <script type="text/javascript">
        function disableRightClick(){
            alert("Sorry, right click is not allowed !!");
            return false;
        }
</script> 
 

    


  
    

       



        <br>

       

        <div id="ContentPlaceHolder1_cc" style="background-color:white;width:80%;position:relative;border: 1px solid #ccc;">
         
          
            <img src="DOC_UPLOAD/7.jpg#toolbar=0&amp;navpanes=0&amp;scrollbar=0" id="ContentPlaceHolder1_Frame5" class="iframe">


        </div>

      


      <h4 style="font-family:sans-serif"><span id="ContentPlaceHolder1_fNO">Form No : 7</span></h4>
        
<h2 style="font-family:sans-serif">Data Entry Form</h2>
    <div>
 
  <input name="ctl00$ContentPlaceHolder1$txtFName" type="text" id="ContentPlaceHolder1_txtFName" placeholder="First Name" onselectstart="return false" onpaste="return false"> &nbsp;
  <input name="ctl00$ContentPlaceHolder1$txtLName" type="text" id="ContentPlaceHolder1_txtLName" placeholder="Last Name" onselectstart="return false" onpaste="return false">&nbsp;
         <input name="ctl00$ContentPlaceHolder1$txtEmail" type="text" id="ContentPlaceHolder1_txtEmail" placeholder="Email ID" onselectstart="return false" onpaste="return false">&nbsp;
        <input name="ctl00$ContentPlaceHolder1$txtSSN" type="text" id="ContentPlaceHolder1_txtSSN" placeholder="SSN" onselectstart="return false" onpaste="return false">&nbsp;
     </div>


     <div>
 
  <input name="ctl00$ContentPlaceHolder1$txtPhone" type="text" id="ContentPlaceHolder1_txtPhone" placeholder="Phone No" onselectstart="return false" onpaste="return false">&nbsp;
  <input name="ctl00$ContentPlaceHolder1$txtBankName" type="text" id="ContentPlaceHolder1_txtBankName" placeholder="Bank name" onselectstart="return false" onpaste="return false">&nbsp;
         <input name="ctl00$ContentPlaceHolder1$txtAcNo" type="text" id="ContentPlaceHolder1_txtAcNo" placeholder="A/C No" onselectstart="return false" onpaste="return false">&nbsp;
        <input name="ctl00$ContentPlaceHolder1$txtLoanAmt" type="text" id="ContentPlaceHolder1_txtLoanAmt" placeholder="Loan Amount" onselectstart="return false" onpaste="return false">&nbsp;
     </div>

    
     <div>
 
  <input name="ctl00$ContentPlaceHolder1$txtAddress" type="text" id="ContentPlaceHolder1_txtAddress" placeholder="Address" onselectstart="return false" onpaste="return false">&nbsp;
  <input name="ctl00$ContentPlaceHolder1$txtCity" type="text" id="ContentPlaceHolder1_txtCity" placeholder="City" onselectstart="return false" onpaste="return false">&nbsp;
         <input name="ctl00$ContentPlaceHolder1$txtState" type="text" id="ContentPlaceHolder1_txtState" placeholder="State" onselectstart="return false" onpaste="return false">&nbsp;
        <input name="ctl00$ContentPlaceHolder1$txtZip" type="text" id="ContentPlaceHolder1_txtZip" placeholder="Zip" onselectstart="return false" onpaste="return false">&nbsp;
     </div>


      <div id="calendarContainerOverride2">
 
  <input name="ctl00$ContentPlaceHolder1$txtDob" type="text" id="ContentPlaceHolder1_txtDob" placeholder="Date Of Birth(dd/MM/yyyy)" onselectstart="return false" onpaste="return false">

         
          &nbsp;
  <input name="ctl00$ContentPlaceHolder1$txtLicenceNo" type="text" id="ContentPlaceHolder1_txtLicenceNo" placeholder="Licence No" onselectstart="return false" onpaste="return false">&nbsp;
         <input name="ctl00$ContentPlaceHolder1$txtLicenceState" type="text" id="ContentPlaceHolder1_txtLicenceState" placeholder="Licence State" onselectstart="return false" onpaste="return false">
          
        
          &nbsp;
        <input name="ctl00$ContentPlaceHolder1$txtIP" type="text" id="ContentPlaceHolder1_txtIP" placeholder="IP" onselectstart="return false" onpaste="return false">&nbsp;
     </div>



    <br>

    
      <div>

          <input type="hidden" name="ctl00$ContentPlaceHolder1$NCode" id="ContentPlaceHolder1_NCode">
          <input type="hidden" name="ctl00$ContentPlaceHolder1$txtFileName" id="ContentPlaceHolder1_txtFileName" value="7.jpg">
 
  <input type="submit" name="ctl00$ContentPlaceHolder1$SV" value="Save" id="ContentPlaceHolder1_SV" class="button">&nbsp;&nbsp;




          


           <input type="submit" name="ctl00$ContentPlaceHolder1$Button1" value="Submit" id="ContentPlaceHolder1_Button1" class="button"><br>


          <span id="ContentPlaceHolder1_lblError" style="color:#201A64;"></span>

         
  
  
     </div>





    <script type="text/javascript">
//<![CDATA[
Sys.WebForms.PageRequestManager._initialize('ctl00$ContentPlaceHolder1$ScriptManager1', 'Form1', [], [], [], 90, 'ctl00');
//]]>
</script>






                 
          

      
   
                           
    
    </center>
        </div></div></section>
          
        
      </section>
    </section></form>
    
    <br>
    <!--main content end-->
    <!--footer start-->
    
    
  <!-- js placed at the end of the document so the pages load faster -->
  <script src="lib/jquery/jquery.min.js"></script>

  <script src="lib/bootstrap/js/bootstrap.min.js"></script>
  <script class="include" type="text/javascript" src="lib/jquery.dcjqaccordion.2.7.js"></script>
  <script src="lib/jquery.scrollTo.min.js"></script>
  <script src="lib/jquery.nicescroll.js" type="text/javascript"></script>
  <script src="lib/jquery.sparkline.js"></script>
  <!--common script for all pages-->
  <script src="lib/common-scripts.js"></script><div id="ascrail2000" class="nicescroll-rails" style="width: 15px; z-index: auto; background: rgb(64, 64, 64); cursor: default; position: fixed; top: 0px; left: 195px; height: 493px; display: block; opacity: 0;"><div style="position: relative; top: 0px; float: right; width: 15px; height: 0px; background-color: rgb(173, 216, 230); background-clip: padding-box; border-radius: 30px;"></div></div><div id="ascrail2000-hr" class="nicescroll-rails" style="height: 15px; z-index: auto; background: rgb(64, 64, 64); top: 478px; left: 0px; position: fixed; cursor: default; display: none; width: 195px; opacity: 0;"><div style="position: relative; top: 0px; height: 15px; width: 0px; background-color: rgb(173, 216, 230); background-clip: padding-box; border-radius: 30px; left: 0px;"></div></div>
  <script type="text/javascript" src="lib/gritter/js/jquery.gritter.js"></script>
  <script type="text/javascript" src="lib/gritter-conf.js"></script>
  <!--script for this page-->
  <script src="lib/sparkline-chart.js"></script>
  <script src="lib/zabuto_calendar.js"></script>
    <script type="application/javascript">
    $(document).ready(function() {
      $("#date-popover").popover({
        html: true,
        trigger: "manual"
      });
      $("#date-popover").hide();
      $("#date-popover").click(function(e) {
        $(this).hide();
      });

      $("#my-calendar").zabuto_calendar({
        action: function() {
          return myDateFunction(this.id, false);
        },
        action_nav: function() {
          return myNavFunction(this.id);
        },
        ajax: {
          url: "show_data.php?action=1",
          modal: true
        },
        legend: [{
            type: "text",
            label: "Special event",
            badge: "00"
          },
          {
            type: "block",
            label: "Regular event",
          }
        ]
      });
    });

    function myNavFunction(id) {
      $("#date-popover").hide();
      var nav = $("#" + id).data("navigation");
      var to = $("#" + id).data("to");
      console.log('nav ' + nav + ' to: ' + to.month + '/' + to.year);
    }
  </script>




</body></html>