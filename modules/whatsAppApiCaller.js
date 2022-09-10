const axios = require("axios");

// module.exports.whatsAppApiCaller = async (
//   data,
//   alertId,
//   finalMessage,
//   execId,
//   callback
// ) => {
//   const cloudTocken =
//     "Bearer EABITbraU3JsBAHMNsbhckia1DWbnkeZBLk2cAfwRYTP2Ee7JljLHGGd8qn7tHQK1sb0WOaj1xy3pBCohujeihfyFbCuHjThTSuWU89Qzq5lZBAwhHG8wUwqAJ9BGsLtkadBJPAdKHYt2TzPPehgDWfgamTiITejSUZBTjpDxqOiIcdD5T0opDeAQM9EYvkK2wS9oyeWkwZDZD";
//   const cloudUrl = "https://graph.facebook.com/v13.0/101459329336163/messages";
//   const oldurl =
//     "https://alpha.api.panel.mapapi.io/whatsapp/60ba619cdc52f500d37e810f/notification";
//   const oldtocken =
//     "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImFwcF82MGJlN2VkZjg5YjA5ODAwZDQ1YjE4OTEifQ.eyJzY29wZSI6ImFwcCJ9.bghgMypz5bsEp0Zp3f56FswY5Rk_iR-zx1MHQMlazgM";

//   const url = cloudUrl;
//   const tocken = cloudTocken;
//   let whatsappBody_paused = {
//     storage: "full",
//     destination: {
//       integrationId: "60be3bbfaa6e4100d373d7ce",
//       destinationId: data.phone_number,
//       // destinationId: '918301848679',
//     },
//     author: {
//       name: "support@moplet.com",
//       email: "Moplet",
//       role: "appMaker",
//     },
//     messageSchema: "whatsapp",
//     message: {
//       type: "template",
//       template: {
//         namespace: "b95d3cd4_9035_4c76_b0bb_788239007519",
//         name: "error_notification",
//         language: {
//           policy: "deterministic",
//           code: "en",
//         },
//         components: [
//           {
//             type: "body",
//             parameters: [
//               {
//                 type: "text",
//                 text: data.name,
//               },
//               {
//                 type: "text",
//                 text: data.email_id,
//               },
//               {
//                 type: "text",
//                 text: data.roll_number,
//               },
//             ],
//           },
//         ],
//       },
//     },
//   };
//   let whatsappBody = {
//     messaging_product: "whatsapp",
//     to: data.phone_number,
//     type: "template",
//     template: {
//       name: "test_n",
//       language: { code: "en" },
//       components: [
//         {
//           type: "body",
//           parameters: [
//             {
//               type: "text",
//               text: "Norbu\\n",
//             },
//           ],
//         },
//       ],
//     },
//   };
  
//   console.log('{[[[[[[[[[[[[[[[[[[]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]');
//   axios({
//     url: url,
//     method: "post",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: tocken,
//     },
//     data: JSON.stringify(whatsappBody),
//     // timeout: 500,
//   })
//     .then((data2) => {
//       const track = {
//         status: "SUCCESS",
//         res_data: JSON.stringify(data2.data ? data2.data : "noREsponse"),
//         ph: data.phone_number,
//         alertId,
//       };
//       //callback params in order of (okData,NotOkData,finalMessage,execId)
//       callback(track, null, finalMessage ? alertId : null, execId);
//       console.log(
//         ".............................misssing fouder............try-then.........................."
//       );
//     })
//     .catch(async (err) => {
//       const NotOkData = {
//         status: "FAILED",
//         alertId,
//         message: finalMessage ? "wasFinal" : "",
//         data,
//         res_data: "",
//         ph: data.phone_number,
//       };
//       //callback params in order of (okData,NotOkData,finalMessage,execId)
//       callback(null, NotOkData, finalMessage ? alertId : null, execId);

//       console.log(err);

//       // await new Promise((resolve) =>
//       //   setTimeout(() => {
//       //     resolve();
//       //   }, 500)
//       // );
//     });
// };
module.exports.whatsAppApiCaller = async (
  data,
  alertId,
  finalMessage,
  execId,
  callback
) => {
  const cloudTocken =
    "Bearer EABITbraU3JsBAHMNsbhckia1DWbnkeZBLk2cAfwRYTP2Ee7JljLHGGd8qn7tHQK1sb0WOaj1xy3pBCohujeihfyFbCuHjThTSuWU89Qzq5lZBAwhHG8wUwqAJ9BGsLtkadBJPAdKHYt2TzPPehgDWfgamTiITejSUZBTjpDxqOiIcdD5T0opDeAQM9EYvkK2wS9oyeWkwZDZD";
  const cloudUrl = "https://graph.facebook.com/v13.0/101459329336163/messages";
  const oldurl =
    "https://alpha.api.panel.mapapi.io/whatsapp/60ba619cdc52f500d37e810f/notification";
  const oldtocken =
    "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImFwcF82MGJlN2VkZjg5YjA5ODAwZDQ1YjE4OTEifQ.eyJzY29wZSI6ImFwcCJ9.bghgMypz5bsEp0Zp3f56FswY5Rk_iR-zx1MHQMlazgM";

  const url = cloudUrl;
  const tocken = cloudTocken;
  let whatsappBody_paused = {
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
  let whatsappBody = {
    messaging_product: "whatsapp",
    to: data.phone_number,
    type: "template",
    template: {
      name: "test_n",
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: "<name>\\n",
            },
          ],
        },
      ],
    },
  };
  
  console.log(execId);
 await axios({
    url: url,
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Authorization: tocken,
    },
    data: JSON.stringify(whatsappBody),
    // timeout: 500,
  })
    .then((data2) => {
      const track = {
        status: "SUCCESS",
        res_data: JSON.stringify(data2.data ? data2.data : "noREsponse"),
        ph: data.phone_number,
        alertId,
      };
      //callback params in order of (okData,NotOkData,finalMessage,execId)
      callback(track, null, finalMessage ? alertId : null, execId);
      console.log(
        `.............................misssing fouder............try-then..........................${execId}`
      );
    })
    .catch(async (err) => {
      const NotOkData = {
        status: "FAILED",
        alertId,
        message: finalMessage ? "wasFinal" : "",
        data,
        res_data: "",
        ph: data.phone_number,
      };
      //callback params in order of (okData,NotOkData,finalMessage,execId)
      callback(null, NotOkData, finalMessage ? alertId : null, execId);

      console.log(
        `.............................misssing fouder............try-catch..........................${execId}`
      );
      // console.log(err);

      // await new Promise((resolve) =>
      //   setTimeout(() => {
      //     resolve();
      //   }, 500)
      // );
    });
};