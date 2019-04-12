var EventCenter = {
  on: function(type, handler){
    $(document).on(type, handler)
  },
  fire: function(type, data){
    $(document).trigger(type, data)
  }
}
/* 
测试
EventCenter.on('kaka', function(e,data){
  console.log(data)
})
EventCenter.fire('kaka','ss')
*/
var Footer = {
  init: function(){
    this.$footer = $('footer')
    this.$ul = this.$footer.find('ul')
    this.$box = this.$footer.find('.box')
    this.$leftBtn = this.$footer.find('.icon-left')
    this.$rightBtn = this.$footer.find('.icon-right')
    this.isToEnd = false
    this.isToStart = true
    this.isAnimate = false
    this.render()
    this.bind()
  },
  bind: function(){
    var _this = this
    this.$rightBtn.on('click', function(){
      if(_this.isAnimate) return
      if(_this.isToEnd) return
      var itemWidth = _this.$footer.find('li').outerWidth(true)
      var rowCount = Math.floor(_this.$box.width() / itemWidth)
      _this.isAnimate = true
      _this.$ul.animate({
        left: '-='+rowCount*itemWidth
      }, 400, function(){
        _this.isAnimate = false
        _this.isToStart = false
        if(parseFloat(_this.$box.width()) - parseFloat(_this.$ul.css('left')) >= parseFloat(_this.$ul.css('width'))){
          _this.isToEnd = true
        }
      })
    })
    this.$leftBtn.on('click', function(){
      if(_this.Animate) return
      if(_this.isToStart) return
      var itemWidth = _this.$footer.find('li').outerWidth(true)
      var rowCount = Math.floor(_this.$box.width() / itemWidth)
      _this.Animate = true
      _this.$ul.animate({
        left: '+='+rowCount*itemWidth
      }, 400, function(){
        _this.Animate = false
        _this.isToEnd = false
        if(parseFloat(_this.$ul.css('left')) === 0){
          _this.isToStart = true
        }
      })
    })
    this.$footer.on('click', 'li', function(){
      $(this).addClass('active').siblings().removeClass('active')
      EventCenter.fire('select-albumn',{
        channelId: $(this).attr('data-channel-id'),
        name: $(this).attr('data-channel-name')
      })
    })
  },
  render: function(){
    var _this = this
    $.getJSON('//jirenguapi.applinzi.com/fm/getChannels.php')
    .done(function(ret){
      _this.renderFooter(ret.channels)
    }).fail(function(){
      console.log('api error')
    })
  },
  renderFooter : function(channels){
    var html = ''
    channels.forEach(function(channel){
      html += '<li data-channel-id='+channel.channel_id+' data-channel-name='+ channel.name +'>'
      html += '<div class="cover" style="background-image:url(' + channel.cover_small + ')"></div>'
      html += '<h3>' + channel.name + '</h3>'
      html += '</li>'
    })
    this.$ul.html(html)
    this.setStyle()
    this.$footer.find('li').eq(0).addClass('active')
  },
  setStyle : function(){
    var count = this.$footer.find('li').length
    var width = this.$footer.find('li').outerWidth(true)
    this.$ul.css('width', width*count+ 'px')
  }
}

var Fm = {
  init: function(){
    this.$container = $('#page-music')
    this.$btnPlay = this.$container.find('.btn-play')
    this.$btnNext = this.$container.find('.btn-next')
    this.audio = new Audio()
    this.audio.autoplay = true
    this.bind()
    this.loadMusic('public_tuijian_spring')
  },
  bind: function(){
    var _this = this
    EventCenter.on('select-albumn',function(e, channelObj){
      _this.channelId = channelObj.channelId
      _this.name = channelObj.name
      _this.loadMusic()
    })
    _this.$btnPlay.on('click', function(){
      if(_this.audio.paused){
        _this.audio.play()
        
      }else{
        _this.audio.pause()
        
      }
    })
    _this.$btnNext.on('click', function(){
      _this.loadMusic()
      _this.$btnPlay.removeClass('icon-play').addClass('icon-pause')
    })
    this.audio.addEventListener('play', function(){
      _this.$btnPlay.removeClass('icon-play').addClass('icon-pause')
      clearInterval(_this.statusClock)
      _this.statusClock = setInterval(function(){
        _this.updateStatus()
      }, 1000)
    })
    this.audio.addEventListener('pause', function(){
      _this.$btnPlay.removeClass('icon-pause').addClass('icon-play')
      clearInterval(_this.statusClock)
    })
  },
  loadMusic: function(origin){
    var _this = this
    $.getJSON('//jirenguapi.applinzi.com/fm/getSong.php',{channel: origin || _this.channelId}).done(function(ret){
      _this.song = ret['song'][0]
      _this.loadLyric()
      _this.setMusic()
    })
  },
  setMusic: function(){
    var _this = this
    _this.audio.src = _this.song.url
    $('.bg').css('background-image', 'url('+ _this.song.picture +')')
    _this.$container.find('figure').css('background-image', 'url('+ _this.song.picture +')')
    _this.$container.find('h1').text(_this.song.title)
    _this.$container.find('.author').text(_this.song.artist)
    _this.$container.find('.tag').text(_this.name)
  },
  loadLyric: function(){
    var _this = this
    var lyricObj = {}
    $.getJSON('//jirenguapi.applinzi.com/fm/getLyric.php',{sid: _this.song.sid}).done(function(ret){
      ret.lyric.split('\n').forEach(function(line){
        var times = line.match(/\d{2}:\d{2}/g)
        var str = line.replace(/\[.+?\]/g, '')
        if(Array.isArray(times)){
          times.forEach(function(){
            lyricObj[times] = str
          })         
        }
      })
      _this.lyricObj = lyricObj
      console.log(lyricObj)
    })
  },
  updateStatus: function(){
    var _this = this
    var min = Math.floor(_this.audio.currentTime / 60 )
    var sec = Math.floor(_this.audio.currentTime % 60 )
    sec = sec < 10 ? '0'+sec : sec
    _this.$container.find('.current-time').text('0' + min + ':' + sec)
    _this.$container.find('.bar-progress').css('width', _this.audio.currentTime / _this.audio.duration * 100 + '%')
    var line = _this.lyricObj['0'+min+':'+sec]
    if(line){
      _this.$container.find('.lyric p').text(line)
      .boomText('bounceIn')
    }
  }
}

$.fn.boomText = function(type){
  type = type || 'rollIn'
  this.html(function(){
    var arr = $(this).text()
    .split('').map(function(word){
        return '<span class="boomText">'+ word + '</span>'
    })
    return arr.join('')
  })
  
  var index = 0
  var $boomTexts = $(this).find('span')
  var clock = setInterval(function(){
    $boomTexts.eq(index).addClass('animated ' + type)
    index++
    if(index >= $boomTexts.length){
      clearInterval(clock)
    }
  }, 100)
}

Footer.init()
Fm.init()
