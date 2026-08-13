<?php
require_once(__DIR__ . "/../lib/Auth.php");
Auth::requireAdmin();
include_once("../templates/classEmma.class.php");

$compid = isset($_GET['compid']) ? (int)$_GET['compid'] : 0;

$isDelCtr = isset($_GET['what']) && $_GET['what'] == "delctr";
$isDelAll = isset($_GET['what']) && $_GET['what'] == "delallctr";
$isStateChange = isset($_POST['btnSave']) || isset($_POST['btnAdd']) || $isDelCtr || $isDelAll;

if ($isStateChange && !Auth::checkCsrf($_POST['csrf'] ?? ($_GET['csrf'] ?? null)))
{
	http_response_code(400);
	exit('Invalid CSRF token');
}

if (isset($_POST['btnSave']))
{
	Emma::UpdateCompetition($compid,$_POST['name'],$_POST['org'],$_POST['date'],$_POST['public'],$_POST['timediff']);
}
else if (isset($_POST['btnAdd']))
{
	Emma::AddRadioControl($compid,$_POST['classname'],$_POST['controlname'],$_POST['code']);
}
else if ($isDelCtr)
{
	Emma::DelRadioControl($compid,$_GET['code'],$_GET['class']);
}
else if ($isDelAll)
{
	Emma::DelAllRadioControls($compid);
}


include_once("../templates/emmalang_sv.php");

   require_once(__DIR__ . "/../lib/Lang.php");
   require_once(__DIR__ . "/../lib/SecurityHeaders.php");
   require_once(__DIR__ . "/../lib/Html.php");
   SecurityHeaders::apply(SecurityHeaders::forHtml());
   $csrf = Auth::csrfToken();

   $lang = Lang::resolve($_GET['lang'] ?? null, __DIR__ . "/../templates", "en");

include_once("../templates/emmalang_$lang.php");



header('Content-Type: text/html; charset='.$CHARSET);

?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
        "http://www.w3.org/TR/html4/loose.dtd">

<html>

<head><title><?=$_TITLE?></title>

<link rel="stylesheet" type="text/css" href="../css/style.css">
<meta name="robots" content="noindex">
<meta http-equiv="Content-Type" content="text/html;charset=<?=$CHARSET?>">
<script language="javascript">

function colorRow(row)

{

var el = document.getElementById(row);

if (el == null)

  return;

el.style.backgroundColor = "#C0D6FF";

}

function resetRow(row)

{

var el = document.getElementById(row);

if (el == null)

  return;

el.style.backgroundColor = "";

}

function confirmDelete(msg,url)
{
  if (confirm(msg))
	{
		window.location = "editComp.php" + url;
	}
}



</script>

</head>

<body topmargin="0" leftmargin="0">

<!-- MAIN DIV -->

<div class="maindiv">

<table width="759" cellpadding="0" cellspacing="0" border="0" ID="Table6">

	<tr>





		<TR>

			<TD>



			</TD>

		</TR>





</table>



<table border="0" cellpadding="0" cellspacing="0" width="759">

  <tr>

     <td valign="bottom">



<!-- MAIN MENU FLAPS - Two rows, note that left and right styles differs from middle ones -->

     <table border="0" cellpadding="0" cellspacing="0">

          <!-- Top row with rounded corners -->

          <tr>

               <td colspan="4"><span class="mttop"></td>

          </tr>

     </table>



     </td>

     <td align="right" valign="bottom">



     </td>

  </tr>

  <tr>

    <td class="submenu" colspan="2">

       <table border="0" cellpadding="0" cellspacing="0">

             <tr>

             <td><a href="admincompetitions.php">Adminpage Competitionindex</a> | </td>
               <td><a href="../index.php"><?=$_CHOOSECMP?> to view</a></td>

             </tr>

       </table>

     </td>

  </tr>

<!-- End SUB MENU -->

  <tr>

    <td class="searchmenu" colspan="2" style="padding: 5px;">

       <table border="0" cellpadding="0" cellspacing="0" width="400">

             <tr>

               <td>
<?php
	$comp = Emma::GetCompetition($compid);
?>
<form name="form1" action="editComp.php?what=comp&compid=<?= (int)$comp['tavid'] ?>" method="post">
<input type="hidden" name="csrf" value="<?= Html::esc($csrf) ?>"/>
<h1 class="categoriesheader">Edit competition</h1>
<b>CompetitionID</b><br/>
<input type="text" name="id" size="35" disabled="true" value="<?= (int)$comp['tavid'] ?>"/><br/>
<b>Competitions Name</b><br/>
<input type="text" name="name" size="35" value="<?= Html::esc($comp['compName']) ?>"/><br/>
<b>Organizer</b><br/>
<input type="text" name="org" size="35" value="<?= Html::esc($comp['organizer']) ?>"/><br/>
<b>Date (format yyyy-mm-dd)</b><br/>
<input type="text" name="date" size="35" value="<?=date("Y-m-d",strtotime($comp['compDate']))?>"/> (ex. 2008-02-03)<br/>
<b>Timezonediff (hours, +1 for finland, 0 for Sweden and -1 for GBR)</b><br/>
<input type="text" name="timediff" size="10" value="<?=$comp['timediff']?>"/><br/>

<b>Public</b><br/>
<input type="checkbox" name="public" <?= $comp['public'] == 1 ? "checked" : "" ?>/><br/><br/>
<input type="submit" name="btnSave" value="Save"/>
</form>
<h1 class="categoriesheader">Radio Controls</h1>

<form name="formrdo1" action="editComp.php?what=radio&compid=<?= (int)$comp['tavid'] ?>" method="post">
<input type="hidden" name="csrf" value="<?= Html::esc($csrf) ?>"/>
<table border="0">
<tr><td><b>Code</td><td><b>Name</td><td><b>Class</td><td><b>Order</td></tr>
<?php
	$rcontrols = Emma::GetRadioControls($compid);
	$csrfUrl = urlencode($csrf);
for ($i = 0; $i < sizeof($rcontrols); $i++)
{
	echo("<tr><td>".Html::esc($rcontrols[$i]["code"])."</td><td>".Html::esc($rcontrols[$i]["name"])."</td><td>".Html::esc($rcontrols[$i]["classname"])."</td><td>".Html::esc($rcontrols[$i]["corder"])."</td><td><a href='javascript:confirmDelete(\"Do you want to delete this radiocontrol?\",\"?what=delctr&compid=".$compid."&code=".(int)$rcontrols[$i]['code']."&class=".urlencode($rcontrols[$i]["classname"])."&csrf=".$csrfUrl."\");'>Delete</a></td></tr>");
}

?>
</table>

<br/><hr/>
<a href="javascript:confirmDelete('Do you want to delete ALL radiocontrols?','?what=delallctr&compid=<?= $compid ?>&csrf=<?= urlencode($csrf) ?>');">Delete all radio controls</a>
<br/><hr/><br/>

<br/><b>Add Radio Control</b><br/>
Code = 1000*passingcnt + controlCode, <br/>
ex. first pass at control 53 => Code = 1053, second pass => Code = 2053<br/>
Code: <input type="text" name="code"/><br/>
Control-Name: <input type="text" name="controlname"/><br/>
ClassName: <input type="text" name="classname"/><br/>
<input type="submit" name="btnAdd" value="Add Control"/>
</form>

		</td>

	     </tr>

	</table>
     </td>

  </tr>



</table>

</div>

<br/><br/>

</body>

</html>