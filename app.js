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
    //this.loginrefresh()
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
  playing: function() {

  },
  geturl: function() {

  },
  //播放模式shuffle，1顺序，2单曲，3随机
  shuffleplay: function() {

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