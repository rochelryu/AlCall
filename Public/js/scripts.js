(function() {
    var id = "";
    var messaged = "";
    var content = "";
    "use strict";
    var socket = io();

    // custom scrollbar

    $("html").niceScroll({styler:"fb",cursorcolor:"#00C6D7", cursorwidth: '5', cursorborderradius: '10px', background: '#002561', spacebarenabled:false, cursorborder: '0',  zindex: '1000'});

    $(".left-side").niceScroll({styler:"fb",cursorcolor:"#00C6D7", cursorwidth: '3', cursorborderradius: '10px', background: '#002561', spacebarenabled:false, cursorborder: '0'});


    $('.mtn').click(function () {
        content = $(this);
        id = $(this).attr('id');
        socket.emit("sendId", id);
    })
    socket.on('resSendId', function (data) {
        $('.chat-mdl-grid.widget-shadow').find('.title3').html("Number " +  data.numbers + " | Ref " +  data.ref + " | Montant " + data.money);
        $('#style-2').html('');
    })
    socket.on('ResSendMessage', function (data) {
        const mol = "#"+id;
        $('#style-2').append("<div class=\"activity-row activity-row1 activity-left\">\n" +
            "                                                                                                                    <div class=\"col-xs-9 activity-img2 animated flash\">\n" +
            "                                                                                                                        <div class=\"activity-desc-sub1\">\n" +
            "                                                                                                                            <p>" + data.message + " </p>\n" +
            "                                                                                                                            <span class=\"right\">à l'instant</span>\n" +
            "                                                                                                                        </div>\n" +
            "                                                                                                                    </div>\n" +
            "                                                                                                                    <div class=\"col-xs-3 activity-img animated slideInRight\"><img src=\"images/ts.jpg\" class=\"img-tchat\" alt=\"\"></div>\n" +
            "                                                                                                                    <div class=\"clearfix\"> </div>\n" +
            "                                                                                                                </div>");
            content = $(mol);
            $(mol).fadeOut(1000);
            $("#sendF").prepend(content);
    });
    $('.reply_inAwait').submit(function () {
        var messs = $(this).find('#TESTS').val();
        if(messs !== ""){
            messaged = messs;
            var me = $('#me').val();
            socket.emit('sendMessage', {id:id, message:messaged, me:me})
            $(this).find('#TESTS').val("");
            return false;
        }
        else {
            return false;
        }
    })
    $('#changePass').click(function () {
        var old = $('#old').val();
        var news = $('#new').val();
        var conf = $('#conf').val();
        var me = $('#me').val();
        if(old == "" || news =="" || conf == ""){
            $.notify({
                position: 3,
                type: 'warn',
                autoClose: true,
                message: "Renseigner Tous les champs"
            });
            return false;
        }
        else if (news !== conf){
            $.notify({
                position: 3,
                type: 'warn',
                autoClose: true,
                message: "La confirmation est differentes du Nouveau password"
            });
            return false;
        }
        else{
            socket.emit('changePass', {old:old, news:news, conf:conf, me:me});
            $('#old').val("");
            $('#new').val("");
            $('#conf').val("");
            return false;
        }
    });
    socket.on('resChangePass', function (data) {
        if(data == 0){
            $.notify({
                position: 3,
                type: 'success',
                message: "Mot de passe changé",
                duration: 4000
            });
        }
        else {
            $.notify({
                position: 3,
                type: 'error',
                message: "Ancien Mot de passe Incorrect",
                duration: 4000
            });
        }
    })
    $('#createAdmin').click(function () {
        var pseudo = $('#inputGroupSuccess1').val();
        var mp = $('#inputGroupSuccess2').val();
        socket.emit('newAdmin', {pseudo:pseudo, password:mp});
        $.notify({
            position: 3,
            type: 'success',
            message: "Admintrateur crée",
            duration: 3000
        });
        $('#inputGroupSuccess1').val("");
        $('#inputGroupSuccess2').val("");
        $('#metaSpolit').prepend("<tr class=\"table-row animated flash\">\n" +
            "                                                                                                            <td class=\"table-img\">\n" +
            "                                                                                                                <img src=\"images/ts.jpg\" style=\"width: 60px;height: 60px\" alt=\"\" />\n" +
            "                                                                                                            </td>\n" +
            "                                                                                                            <td class=\"table-text\">\n" +
            "                                                                                                                <h6>"+ pseudo + "</h6>\n" +
            "                                                                                                            </td>\n" +
            "                                                                                                            <td>\n" +
            "                                                                                                                <span class=\"fam\">0</span>\n" +
            "                                                                                                            </td>\n" +
            "                                                                                                            <td class=\"march\">\n" +
            "                                                                                                                Aucune Connection\n" +
            "                                                                                                            </td>\n" +
            "                                                                                                        </tr>");
    });
    $(".left-side").getNiceScroll();
    if ($('body').hasClass('left-side-collapsed')) {
        $(".left-side").getNiceScroll().hide();
    }



    // Toggle Left Menu
   jQuery('.menu-list > a').click(function() {
      
      var parent = jQuery(this).parent();
      var sub = parent.find('> ul');
      
      if(!jQuery('body').hasClass('left-side-collapsed')) {
         if(sub.is(':visible')) {
            sub.slideUp(200, function(){
               parent.removeClass('nav-active');
               jQuery('.main-content').css({height: ''});
               mainContentHeightAdjust();
            });
         } else {
            visibleSubMenuClose();
            parent.addClass('nav-active');
            sub.slideDown(200, function(){
                mainContentHeightAdjust();
            });
         }
      }
      return false;
   });

   function visibleSubMenuClose() {
      jQuery('.menu-list').each(function() {
         var t = jQuery(this);
         if(t.hasClass('nav-active')) {
            t.find('> ul').slideUp(200, function(){
               t.removeClass('nav-active');
            });
         }
      });
   }

   function mainContentHeightAdjust() {
      // Adjust main content height
      var docHeight = jQuery(document).height();
      if(docHeight > jQuery('.main-content').height())
         jQuery('.main-content').height(docHeight);
   }

   //  class add mouse hover
   jQuery('.custom-nav > li').hover(function(){
      jQuery(this).addClass('nav-hover');
   }, function(){
      jQuery(this).removeClass('nav-hover');
   });


   // Menu Toggle
   jQuery('.toggle-btn').click(function(){
       $(".left-side").getNiceScroll().hide();
       
       if ($('body').hasClass('left-side-collapsed')) {
           $(".left-side").getNiceScroll().hide();
       }
      var body = jQuery('body');
      var bodyposition = body.css('position');

      if(bodyposition != 'relative') {

         if(!body.hasClass('left-side-collapsed')) {
            body.addClass('left-side-collapsed');
            jQuery('.custom-nav ul').attr('style','');

            jQuery(this).addClass('menu-collapsed');

         } else {
            body.removeClass('left-side-collapsed chat-view');
            jQuery('.custom-nav li.active ul').css({display: 'block'});

            jQuery(this).removeClass('menu-collapsed');

         }
      } else {

         if(body.hasClass('left-side-show'))
            body.removeClass('left-side-show');
         else
            body.addClass('left-side-show');

         mainContentHeightAdjust();
      }

   });
   

   searchform_reposition();

   jQuery(window).resize(function(){

      if(jQuery('body').css('position') == 'relative') {

         jQuery('body').removeClass('left-side-collapsed');

      } else {

         jQuery('body').css({left: '', marginRight: ''});
      }

      searchform_reposition();

   });

   function searchform_reposition() {
      if(jQuery('.searchform').css('position') == 'relative') {
         jQuery('.searchform').insertBefore('.left-side-inner .logged-user');
      } else {
         jQuery('.searchform').insertBefore('.menu-right');
      }
   }
})(jQuery);

                      // Dropdowns Script
						$(document).ready(function() {
						  $(document).on('click', function(ev) {
						    ev.stopImmediatePropagation();
						    $(".dropdown-toggle").dropdown("active");
						  });
						});
						
	
     
  /************** Search ****************/
		$(function() {
	    var button = $('#loginButton');
	    var box = $('#loginBox');
	    var form = $('#loginForm');
	    button.removeAttr('href');
	    button.mouseup(function(login) {
	        box.toggle();
	        button.toggleClass('active');
	    });
	    form.mouseup(function() { 
	        return false;
	    });
	    $(this).mouseup(function(login) {
	        if(!($(login.target).parent('#loginButton').length > 0)) {
	            button.removeClass('active');
	            box.hide();
	        }
	    });
	});
	