var bsurl = require('./utils/bsurl.js')
var nt = require('./utils/nt.js')
App({
  onLaunch: function () {
    var cookie = wx.getStorageSync('cookie') || ''
    var gb = wx.getStorageSync('globalData')
    gb && (this.globalData = gb)
    this.globalData.cookie = cookie
    var that = this
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
  mine: function() {

  },
  likelist: function() {

  },
  loginrefresh: function() {

  },
  //播放列表中下一首
  nextplay: function() {

  },
  //下一首fm
  nextfm: function() {

  },
  preplay: function() {

  },
  getfm: function() {

  },
  stopmusic: function() {

  },
  seekmusic: function() {

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