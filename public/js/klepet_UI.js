function divElementEnostavniTekst(sporocilo) {
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
  var jeVideo = sporocilo.indexOf('iframe src="https://www.youtube.com/embed/') > -1;
  var jeSlika = sporocilo.match(/(http|https)/g) && sporocilo.match(/(.jpg|.png|.gif)/g);
  
  if (jeSmesko ) {
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('png\' /&gt;', 'png\' />');
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } 
  else if(jeSlika) {
    return $('<div style="font-weight: bold;"></div>').html(sporocilo);
  }
  else if (jeVideo) {
      //console.log("ratal je");
      return $('<div style="font-weight: bold;"></div>').html(sporocilo);
  } else  {
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }


  
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  sporocilo = dodajSmeske(sporocilo);
  sporocilo = dodajSlike(sporocilo);
  sporocilo = dodajVideo(sporocilo)
  //sporocilo = dodajVideo(sporocilo);
  var sistemskoSporocilo;

  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
    }
  } else {
    
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));

    
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
    
  }

  $('#poslji-sporocilo').val('');
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";
var link;

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }
    
    $('#seznam-uporabnikov div').click(function() {
      
      // var abc = '/zasebno';
      // $('#poslji-sporocilo').focus();
      $('#poslji-sporocilo').val('/zasebno "' + $(this).text() +  "\"\ ");
      $('#poslji-sporocilo').focus();
     
    });
    
  });

  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}

function dodajSlike (vhodnoBesedilo) {
  // var novoBesedilo = "deluje";
  
  if (vhodnoBesedilo.match(/(http|https)/g) && vhodnoBesedilo.match(/(.jpg|.png|.gif)/g))  {
     var link = "" + vhodnoBesedilo + "\n";
     var dodajVmes = /((http|https):\/\/[^\s]*(.jpg|.gif|.png))/g;
     vhodnoBesedilo = vhodnoBesedilo.replace(dodajVmes, "<img src=\"$1\" alt=\"dodajVmes\" id=\"slike\">");
     return vhodnoBesedilo;
   }

  
  else{
    return vhodnoBesedilo;
  }
  
}
function dodajVideo(vhodnoBesedilo){
  if (vhodnoBesedilo.indexOf('https://www.youtube.com/') > -1){
    link = vhodnoBesedilo;
    var videoID = dobiIDvidea(vhodnoBesedilo);
    return vhodnoBesedilo.replace(vhodnoBesedilo, '<iframe src="https://www.youtube.com/embed/' + videoID + '" id="youtube" allowfullscreen></iframe>');
    
    
  }
  else{
    return vhodnoBesedilo;
  }
}
 function dobiIDvidea(vhodnoBesedilo){
    var regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    var match = vhodnoBesedilo.match(regExp);
    if (match && match[2].length == 11) {
      return match[2];
    } else {
      //error
    }
  
 }
  
      
    
  



