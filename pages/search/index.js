var bsurl = require('../../utils/bsurl.js')
var typelist = require('../../utils/searchtypelist.js')
var nt = require('../../utils/nt.js')
var app = getApp()
Page({
  data: {
    tab: { 
      tab: typelist[0].type, 
      index: 0 
    },
    value: "",
    tabs: typelist,
    recent: wx.getStorageSync("recent") || [],
    loading: false,
    prevalue: ""
  },
  onLoad: function(options) {
    let v = options.key
    v && this.search(v)
  },
  inputext: function (e) {
    let name = e.detail.value
    this.setData({ 
      value: name
    })
  },
  playmusic: function (event) {
    let that = this
    let music = event.currentTarget.dataset.idx
    let st = event.currentTarget.dataset.st
    if (st * 1 < 0) {
      wx.showToast({
        title: '歌曲已下架',
        icon: 'success',
        duration: 2000
      })
      return
    }
    music = that.data.tabs[0].relist.songs[music]
    app.globalData.curplay = music
  },
  search: function (name) {
    if (!name || (name == this.data.prevalue)) return
    let index = this.data.tab.index
    let tl = typelist
    this.setData({
      tabs: tl,
      prevalue: name,
      value: name,
      loading: true
    })
    let curtab = this.data.tabs[index]
    let that = this
    tl = this.data.tabs
    this.httpsearch(name, curtab.offset, this.data.tab.tab, function (res) {
      curtab.relist = res
      curtab.loading = true
      let resultarry = res.songs || res.artists || res.albums || res.playlists || res.mvs || res.djprograms || res.userprofiles || []
      curtab.offset = resultarry.length
      let size = res.songCount || res.artistCount || res.albumCount || res.playlistCount || res.mvCount || res.djprogramCount || res.userprofileCount
      size = size ? size : 0
      curtab.none = curtab.offset >= size ? true : false
      tl[index] = curtab
      let recent = that.data.recent
      let curname = recent.findIndex(function (e) { return e == name })
      if (curname > -1) {
        recent.splice(curname, 1)
      }
      recent.unshift(name)
      wx.setStorageSync('recent', recent)
      that.setData({
        tabs: tl,
        loading: true,
        recent: recent,
        prevalue: name
      })
    }, function () {
      curtab.loading = true
      curtab.none = true
      tl[index] = curtab
      that.setData({
        tabs: tl
      })
    })
  },
  searhFrecent: function (e) {
    this.search(e.currentTarget.dataset.value)
  },
  searhFinput: function (e) {
    this.search(e.detail.value.name)
  },
  onReachBottom: function (e) {
    let tl = this.data.tabs
    let that = this
    let curtab = tl[this.data.tab.index]
    if (curtab.none) return
    curtab.loading = false
    tl[this.data.tab.index] = curtab
    this.setData({
      tabs: tl
    })
    this.httpsearch(this.data.prevalue, curtab.offset, this.data.tab.tab, function (res) {
      curtab.loading = true
      let resultarry = res.songs || res.artists || res.albums || res.playlists || res.mvs || res.djprograms || res.userprofiles || []
      let size = res.songCount || res.artistCount || res.albumCount || res.playlistCount || res.mvCount || res.djprogramCount || res.userprofileCount
      size = size ? size : 0
      let length = resultarry.length
      curtab.offset = curtab.offset + length
      curtab.none = curtab.offset >= size ? true : false
      curtab.relist.songs = curtab.relist.songs ? curtab.relist.songs.concat(resultarry) : null
      curtab.relist.artists = curtab.relist.artists ? curtab.relist.artists.concat(resultarry) : null
      curtab.relist.albums = curtab.relist.albums ? curtab.relist.albums.concat(resultarry) : null
      curtab.relist.playlists = curtab.relist.playlists ? curtab.relist.playlists.concat(resultarry) : null
      curtab.relist.mvs = curtab.relist.mvs ? curtab.relist.mvs.concat(resultarry) : null
      curtab.relist.djprograms = curtab.relist.djprograms ? curtab.relist.djprograms.concat(resultarry) : null
      curtab.relist.userprofiles = curtab.relist.userprofiles ? curtab.relist.userprofiles.concat(resultarry) : null
      tl[that.data.tab.index] = curtab
      that.setData({
        tabs: tl
      })
    }, function () {
      curtab.loading = true
      curtab.none = true
      tl[that.data.tab.index] = curtab
      that.setData({
        tabs: tl
      })
    })
  },
  httpsearch: function (name, offset, type, cb, err) {
    wx.request({
      url: bsurl + 'search',
      data: {
        keywords: name,
        offset: offset,
        limit: 20,
        type: type
      },
      method: 'GET',
      success: function (res) {
        cb && cb(res.data.result)
      },
      fail: function () {
        err && err()
      }
    })
  },
  tabtype: function (e) {
    let index = e.currentTarget.dataset.index
    let curtab = this.data.tabs[index]
    let type = e.currentTarget.dataset.tab
    let that = this
    let tl = that.data.tabs
    if (!curtab.loading) {
      this.httpsearch(this.data.prevalue, curtab.offset, type, function (res) {
        curtab.relist = res
        curtab.loading = true
        let resultarry = res.songs || res.artists || res.albums || res.playlists || res.mvs || res.djprograms || res.userprofiles || []
        curtab.offset = resultarry.length
        let size = res.songCount || res.artistCount || res.albumCount || res.playlistCount || res.mvCount || res.djprogramCount || res.userprofileCount
        size = size ? size : 0
        curtab.none = curtab.offset >= size ? true : false
        tl[index] = curtab
        that.setData({
          tabs: tl
        })
      }, function () {
        curtab.loading = true
        curtab.none = true
        tl[index] = curtab
        that.setData({
          tabs: tl
        })
      })
    }
    this.setData({
      tab: {
        tab: type,
        index: index
      }
    })
  },
  clear_kw: function () {
    this.setData({
      value: "",
      loading: false,
      tabs: typelist,
      prevalue: ""
    })
  },
  del_research: function (e) {
    let index = e.currentTarget.dataset.index
    this.data.recent.splice(index, 1)
    this.setData({
      recent: this.data.recent
    })
    wx.setStorageSync('recent', this.data.recent)
  }
})