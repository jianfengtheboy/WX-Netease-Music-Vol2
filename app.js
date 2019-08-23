var bsurl = require('./utils/bsurl.js')
var nt = require('./utils/nt.js')
App({
  onLaunch: function () {
    var cookie = wx.getStorageSync('cookie') || ''
    var gb = wx.getStorageSync('globalData')
    gb && (this.globalData = gb)
    this.globalData.cookie = cookie
    let that = this
    //播放列表中下一首
    wx.onBackgroundAudioStop(function() {
      if (that.globalData.globalStop) {
        return
      }
      if (that.globalData.playtype != 2) {
        that.nextplay(that.globalData.playtype)
      } else {
        that.nextfm()
      }
    })
    //监听音乐暂停，保存播放进度广播暂停状态
    wx.onBackgroundAudioPause(function() {
      nt.postNotificationName("music_toggle", {
        playing: false,
        playtype: that.globalData.playtype,
        music: that.globalData.curplay || {}
      })
      that.globalData.playing = false
      that.globalData.globalStop = that.globalData.hide ? true : false
      wx.getBackgroundAudioPlayerState({
        complete: function(res) {
          that.globalData.currentPosition = res.currentPosition ? res.currentPosition : 0
        }
      })
    })
    this.mine()
    this.likelist()
    this.loginrefresh()
  },
  //我的
  mine: function() {
    let that = this
    wx.request({
      url: bsurl + 'mine',
      success: function(res) {
        that.globalData.user = res.data
        wx.setStorageSync('user', res.data)
      }
    })
  },
  //喜欢列表
  likelist: function() {
    let that = this
    this.globalData.cookie && wx.request({
      url: bsurl + 'likelist',
      success: function(res) {
        that.globalData.staredlist = res.data.ids
      }
    })
  },
  //登陆刷新
  loginrefresh: function() {
    wx.request({
      url: bsurl + 'login/refresh',
      data: {
        cookie: this.globalData.cookie
      },
      success: function(res) {
        console.log(res)
      }
    })
  },
  //播放列表中下一首
  nextplay: function(t, cb, pos) {
    this.preplay()
    if (this.globalData.playtype == 2) {
      this.nextfm()
      return
    }
    var list = this.globalData.playtype == 1 ? this.globalData.list_am : this.globalData.list_dj
    var index = this.globalData.playtype == 1 ? this.globalData.index_am : this.globalData.index_dj
    if (t == 1) {
      index ++
    } else {
      index --
    }
    index = index > list.length - 1 ? 0 : (index < 0 ? list.length - 1 : index)
    index = pos != undefined ? pos : index
    this.globalData.curplay = (this.globalData.playtype == 1 ? list[index] : list[index].mainSong) || this.globalData.curplay
    if (this.globalData.staredlist.indexOf(this.globalData.curplay.id) != -1) {
      this.globalData.curplay.starred = true
      this.globalData.curplay.st = true
    }
    if (this.globalData.playtype == 1) {
      this.globalData.index_am = index
    } else {
      this.globalData.index_dj = index
    }
    nt.postNotificationName("music_next", {
      music: this.globalData.curplay,
      playtype: this.globalData.playtype,
      p: this.globalData.playtype == 1 ? [] : list[index],
      index: this.globalData.playtype == 1 ? this.globalData.index_am : this.globalData.index_dj
    })
    this.seekmusic(this.globalData.playtype)
    cb && cb()
  },
  //下一首fm
  nextfm: function(cb) {
    this.preplay()
    let that = this
    let list = that.globalData.list_fm
    let index = that.globalData.index_fm
    index ++
    this.globalData.playtype = 2
    if (index > list.length -1) {
      that.getfm()
    } else {
      that.globalData.index_fm = index
      that.globalData.curplay = list[index]
      if (this.globalData.staredlist.indexOf(this.globalData.curplay.id) != -1) {
        this.globalData.curplay.starred = true
        this.globalData.curplay.st = true
      }
      that.seekmusic(2)
      nt.postNotificationName("music_next", {
        music: this.globalData.curplay,
        playtype: 2,
        index: index
      })
      cb && cb()
    }
  },
  //歌曲切换 停止当前音乐
  preplay: function() {
    this.globalData.playing = false
    this.globalData.globalStop = true
    wx.pauseBackgroundAudio()
  },
  //fm
  getfm: function() {
    let that = this
    wx.request({
      url: bsurl + 'fm',
      success: function(res) {
        that.globalData.list_fm = res.data.data
        that.globalData.index_fm = 0
        that.globalData.curplay = res.data.data[0]
        if (that.globalData.staredlist.indexOf(that.globalData.curplay.id) != -1) {
          that.globalData.curplay.starred = true
          that.globalData.curplay.st = true
        }
        that.seekmusic(2)
        nt.postNotificationName("music_next", {
          music: that.globalData.curplay,
          playtype: 2,
          index: 0
        })
      }
    })
  },
  //暂停播放
  stopmusic: function(type, cb) {
    wx.pauseBackgroundAudio()
  },
  seekmusic: function(type, seek, cb) {
    let that = this
    let m = this.globalData.curplay
    if (!m.id) return
    this.globalData.playtype = type
    if (cb) {
      this.playing(type, cb, seek)
    } else {
      this.geturl(function () { 
        that.playing(type, cb, seek) 
      })
    }
  },
  //播放
  playing: function(type, cb, seek) {
    let that = this
    let m = that.globalData.curplay
    wx.playBackgroundAudio({
      dataUrl: m.url,
      title: m.name,
      success: function(res) {
        if (seek != undefined) {
          wx.seekBackgroundAudio({
            position: seek 
          })
        }
        that.globalData.globalStop = false
        that.globalData.playtype = type
        that.globalData.playing = true
        nt.postNotificationName("music_toggle", {
          playing: true,
          music: that.globalData.curplay,
          playtype: that.globalData.playtype
        })
        cb && cb()
      },
      fail: function() {
        if (type != 2) {
          that.nextplay(1)
        } else {
          that.nextfm()
        }
      }
    })
  },
  geturl: function(suc, err, cb) {
    let that = this
    let m = that.globalData.curplay
    wx.request({
      url: bsurl + 'music/url',
      data: {
        id: m.id,
        br: m.duration ? ((m.hMusic && m.hMusic.bitrate) || (m.mMusic && m.mMusic.bitrate) || (m.lMusicm && m.lMusic.bitrate) || (m.bMusic && m.bMusic.bitrate)) : (m.privilege ? m.privilege.maxbr : ((m.h && m.h.br) || (m.m && m.m.br) || (m.l && m.l.br) || (m.b && m.b.br))),
        br: 128000
      },
      success: function(a) {
        a = a.data.data[0]
        if (!a.url) {
          err && err()
        } else {
          that.globalData.curplay.url = a.url
          that.globalData.curplay.getutime = (new Date()).getTime()
          if (that.globalData.staredlist.indexOf(that.globalData.curplay.id) != -1) {
            that.globalData.curplay.starred = true
            that.globalData.curplay.st = true
          }
          suc && suc()
        }
      }
    })
  },
  //播放模式shuffle，1顺序，2单曲，3随机
  shuffleplay: function(shuffle) {
    let that = this
    that.globalData.shuffle = shuffle
    if (shuffle == 1) {
      that.globalData.list_am = that.globalData.list_sf
    } else if (shuffle == 2) {
      that.globalData.list_am = [that.globalData.curplay]
    } else {
      that.globalData.list_am = [].concat(that.globalData.list_sf)
      let sort = that.globalData.list_am
      sort.sort(function() {
        return Math.random() - (0.5) ? 1 : -1
      })
    }
    for (let s in that.globalData.list_am) {
      if (that.globalData.list_am[s].id == that.globalData.curplay.id) {
        that.globalData.index_am = s
      }
    }
  },
  onShow: function() {
    this.globalData.hide = false
  },
  onHide: function() {
    this.globalData.hide = true
    wx.setStorageSync('globalData', this.globalData)
  },
  globalData: {
    hasLogin: false,
    hide: false,
    list_am: [],
    list_dj: [],
    list_fm: [],
    list_sf: [],
    index_dj: 0,
    index_fm: 0,
    index_am: 0,
    playing: false,
    playtype: 1,
    curplay: {},
    shuffle: 1,
    globalStop: true,
    currentPosition: 0,
    staredlist: [],
    cookie: "",
    user: {}
  }
})