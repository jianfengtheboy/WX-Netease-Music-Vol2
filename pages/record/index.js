// pages/record/index.js
var app = getApp()
var bsurl = require('../../utils/bsurl.js')
Page({
  data: {
    loading: false,
    weekData: [],
    allData: [],
    code: 0,
    tab: 1,
    curplay: -1
  },
  onLoad: function (options) {
    let that = this
    wx.request({
      url: bsurl + 'record',
      data: {
        cookie: app.globalData.cookie, 
        uid: options.uid, 
        type: 1
      },
      success: res => {
        that.setData({
          weekData: res.data
        })
      }
    })
    wx.request({
      url: bsurl + 'record',
      data: {
        uid: options.uid, 
        type: 0
      },
      success: res => {
        that.setData({
          allData: res.data
        })
      },
      complete: () => {
        that.setData({
          loading: true
        })
      }
    })
  },
  switchtab: function (e) {
    var t = e.currentTarget.dataset.t
    this.setData({ 
      tab: t 
    })
  }
})