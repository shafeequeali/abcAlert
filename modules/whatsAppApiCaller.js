module.exports.whatsAppApiCaller = async (
  data,
  alertId,
  finalMessage,
  callback
) => {
  const url =
    "https://alpha.api.panel.mapapi.io/whatsapp/60ba619cdc52f500d37e810f/notification";

  let whatsappBody = {
    storage: "full",
    destination: {
      integrationId: "60be3bbfaa6e4100d373d7ce",
      destinationId: data.phone_number,
      // destinationId: '918301848679',
    },
    author: {
      name: "support@moplet.com",
      email: "Moplet",
      role: "appMaker",
    },
    messageSchema: "whatsapp",
    message: {
      type: "template",
      template: {
        namespace: "b95d3cd4_9035_4c76_b0bb_788239007519",
        name: "error_notification",
        language: {
          policy: "deterministic",
          code: "en",
        },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: data.name,
              },
              {
                type: "text",
                text: data.email_id,
              },
              {
                type: "text",
                text: data.roll_number,
              },
            ],
          },
        ],
      },
    },
  };
  try {
    let wRes = await axios({
      url: url,
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImFwcF82MGJlN2VkZjg5YjA5ODAwZDQ1YjE4OTEifQ.eyJzY29wZSI6ImFwcCJ9.bghgMypz5bsEp0Zp3f56FswY5Rk_iR-zx1MHQMlazgM",
      },
      data: JSON.stringify(whatsappBody),
      // timeout: 500,
    });
    const track = {
      status: "SUCCESS",
      res_data: JSON.stringify(wRes.data ? wRes.data : "noREsponse"),
      ph,
      alertId,
    };
    //callback params in order of (okData,NotOkData,finalMessage)
    callback(track, null, finalMessage ? alertId : null);
  } catch (err) {
    try {
      let wRes = await axios({
        url: url,
        method: "post",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImFwcF82MGJlN2VkZjg5YjA5ODAwZDQ1YjE4OTEifQ.eyJzY29wZSI6ImFwcCJ9.bghgMypz5bsEp0Zp3f56FswY5Rk_iR-zx1MHQMlazgM",
        },
        data: JSON.stringify(whatsappBody),
        // timeout: 500,
      });
      const track = {
        status: "SUCCESS",
        res_data: JSON.stringify(wRes.data ? wRes.data : "noREsponse"),
        ph,
        alertId,
      };
      //callback params in order of (okData,NotOkData,finalMessage)
      callback(track, null, finalMessage ? alertId : null);
    } catch (err2) {
      const NotOkData = {
        status: "FAILED",
        alertId,
        message: "wasFinal",
        data,
      };
      //callback params in order of (okData,NotOkData)
      callback(null, NotOkData, finalMessage ? alertId : null);
    }
  }
};
