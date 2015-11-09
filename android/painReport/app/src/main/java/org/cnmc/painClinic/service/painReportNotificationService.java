package org.cnmc.painClinic.service;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.ProgressDialog;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.BitmapFactory;
import android.net.ConnectivityManager;
import android.os.AsyncTask;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.preference.PreferenceManager;
import android.support.v4.app.NotificationCompat;
import android.util.Log;
import android.view.View;
import android.widget.Toast;


import org.apache.http.HttpResponse;
import org.apache.http.client.ResponseHandler;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.BasicResponseHandler;
import org.apache.http.impl.client.DefaultHttpClient;
import org.cnmc.painClinic.R;
import org.cnmc.painClinic.helper.propertiesReader;
import org.cnmc.painClinic.painReport.MainActivity;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URLEncoder;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

public class painReportNotificationService extends Service {

    private PowerManager.WakeLock mWakeLock;
    private org.cnmc.painClinic.helper.propertiesReader propertiesReader;
    private String notifQueryUrl;
    private String submitSurveyUrl;
    private String pendingSurvey;
    private String pin="";
    private static int NOTIF_TIME_LOWER_BOUND = 18;
    private static int NOTIF_TIME_UPPER_BOUND = 21;
    public painReportNotificationService() {
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }


    private void handleIntent(Intent intent) {
        //get notifQueryUrl
        propertiesReader=new propertiesReader(getApplicationContext());
        notifQueryUrl=getFromSharedPreferences("surveyAppServerSettings")+"/check_surveys";
        notifQueryUrl.trim();
        submitSurveyUrl=getFromSharedPreferences("surveyAppServerSettings")+"/submit_survey";
        submitSurveyUrl.trim();

        //get PIN number from shared preferences
        pin=getFromSharedPreferences("PIN");
        pendingSurvey=getFromSharedPreferences("pendingSurvey");

        //params list to send to doInBackground
        Map<String,String> urls=new HashMap<String,String>();

        //add pin number to the notifQueryUrl
        if(!pin.equals("No PIN found.") && !pin.equals("")){
            notifQueryUrl=notifQueryUrl+"?userPIN="+pin;
            urls.put("checkSurvey",notifQueryUrl);
        }

        //check for pending surveys
        if(!pendingSurvey.equals("No Survey in progress") && !pendingSurvey.equals("") && pendingSurvey!=null){
            urls.put("pendingSurvey",pendingSurvey);
            urls.put("submitSurveyUrl",submitSurveyUrl);
        }
        // obtain the wake lock
        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        mWakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "PARTIAL_WAKE_LOCK");
        mWakeLock.acquire();

        // check the global background data setting but since getBackgroundDataService
        // is deprecated getActiveNetworkInfo is used
        ConnectivityManager cm = (ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE);
        if (cm.getActiveNetworkInfo() == null || !cm.getActiveNetworkInfo().isAvailable() || !cm.getActiveNetworkInfo().isConnected()) {
            stopSelf();
            return;
        }

        // asyncTask handles the actual polling so as not to crash the main UI thread
        if(urls.containsKey("checkSurvey")||urls.containsKey("pendingSurvey")){
            new PollTask().execute(urls);
        }
    }

    private String getFromSharedPreferences(String key){
        String value="";
        SharedPreferences sharedPrefs = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());
        if(sharedPrefs.contains(key)) {
           value= sharedPrefs.getString(key, null);
        }
        return value;
    }
    public class survey{
        Date dueDate;
        String title;
        Long instanceId;
    }
    private class PollTask extends AsyncTask<Map<String,String>, Void, Map<String,String>> {

        @Override
        protected Map<String,String> doInBackground(Map<String,String>... params) {
            Map<String,String> urls=params[0];
            Map<String,String> returnVals=new HashMap<String,String>();
            String response = "";

            if(urls.containsKey("checkSurvey")){
                String url=urls.get("checkSurvey");
                DefaultHttpClient client = new DefaultHttpClient();
                try {
                    //String safeUrl = URLEncoder.encode(url,"UTF-8");
                    HttpGet httpGet = new HttpGet(url);
                    HttpResponse execute = client.execute(httpGet);
                    InputStream content = execute.getEntity().getContent();

                    BufferedReader buffer = new BufferedReader(new InputStreamReader(content));
                    String s = "";
                    while ((s = buffer.readLine()) != null) {
                        response += s;
                    }

                } catch (Exception e) {
                    e.printStackTrace();
                }
                if(isJSONValid(response)){
                    returnVals.put("checkSurvey",response);
                }
            }

            if(urls.containsKey("pendingSurvey")){
                notifBuilder("PainReport","You have a un-submitted survey,we will try to send the survey for you");
                try {
                    //instantiates httpclient to make request
                    DefaultHttpClient httpclient = new DefaultHttpClient();

                    //url with the post data
                    HttpPost httpost = new HttpPost(urls.get("submitSurveyUrl"));

                    String pendingSurvey=urls.get("pendingSurvey");
                    //passes the results to a string builder/entity
                    StringEntity se = new StringEntity(pendingSurvey);

                    //sets the post request as the resulting string
                    httpost.setEntity(se);
                    //sets a request header so the page receving the request
                    //will know what to do with it
                    httpost.setHeader("Accept", "application/json");
                    httpost.setHeader("Content-type", "application/json");

                    //Handles what is returned from the page
                    ResponseHandler responseHandler = new BasicResponseHandler();

                    httpclient.execute(httpost, responseHandler);

                    notifBuilder("PainReport","We submitted the survey for you");

                    SharedPreferences sharedPrefs = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());
                    SharedPreferences.Editor editor=sharedPrefs.edit();
                    editor.putString("pendingSurvey",null);
                    editor.commit();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            return returnVals;
        }

        private boolean isJSONValid(String test) {
            boolean result=true;
            try {
                new JSONObject(test);
            } catch (JSONException ex) {
                // edited, to include @Arthur's comment
                // e.g. in case JSONArray is valid as well...
                try {
                    new JSONArray(test);
                } catch (JSONException ex1) {
                    result= false;
                }
            }
            return result;
        }
        @Override
        protected void onPostExecute(Map<String,String> results) {

            String survey="";
            if(results.containsKey("checkSurvey")) {
                String result=results.get("checkSurvey");
                //parse json data
                try {
                    JSONObject jsonResponse=new JSONObject(result);
                    JSONArray surveys = jsonResponse.getJSONArray("surveys");
                    String title;
                    Boolean okayToStart;

                    if(surveys.length()>0){
                        JSONObject jsonSurveyObj=surveys.getJSONObject(0);
                        title=jsonSurveyObj.getString("surveyTitle");
                        okayToStart=jsonSurveyObj.getBoolean("okayToStart");

                        if(okayToStart && compareToCurrentTime(NOTIF_TIME_LOWER_BOUND,0)==-1 && compareToCurrentTime(NOTIF_TIME_UPPER_BOUND,0)==1){

                            String notifContent="You have a "+title+" today";
                            notifBuilder("PainReport",notifContent);
                        }
                    }

                } catch (JSONException e) {
                    Log.e("log_tag", "Error parsing data " + e.toString());
                }
                Log.d("Response",survey);
            }
            else{
                Log.e("log_tag", "No Response from server");
            }
        }
    }


    private int compareToCurrentTime(int hour, int mins){
        Calendar today=Calendar.getInstance();
        Calendar input=Calendar.getInstance();
        input.set(Calendar.HOUR_OF_DAY,hour);
        input.set(Calendar.MINUTE,mins);
        input.set(Calendar.SECOND,0);

        Date currentTime;
        int returnVal=input.compareTo(today);

        return returnVal;
    }

    public void notifBuilder(String contentTitle,String contentText){
        int currentapiVersion = android.os.Build.VERSION.SDK_INT;
        int SERVER_DATA_RECEIVED = 1;
        Intent intent = new Intent(getApplicationContext(), MainActivity.class);
        //Notification.Builder is not available for API version <11 i.e HoneyComb
        //Else condition only applies to API level 10 i.e. Gingerbread
        if(currentapiVersion> Build.VERSION_CODES.GINGERBREAD){

            NotificationManager notificationManager =
                    (NotificationManager) getSystemService(NOTIFICATION_SERVICE);

            PendingIntent pendingIntent = PendingIntent.getActivity(getApplicationContext(),
                    SERVER_DATA_RECEIVED, intent, PendingIntent.FLAG_UPDATE_CURRENT);
            Notification.Builder builder = new Notification.Builder(getApplicationContext())
                    .setSmallIcon(R.drawable.bearnotif)
                    .setLargeIcon(BitmapFactory.decodeResource(getResources(), R.drawable.ic_launcher))
                    .setAutoCancel(true)
                    .setContentIntent(pendingIntent)
                    .setContentTitle(contentTitle)
                    .setContentText(contentText);

            //getNotification only gets called in API VERSION>11, this check is already performed
            Notification notification=builder.getNotification();
            notification.flags |= Notification.FLAG_NO_CLEAR | Notification.FLAG_ONGOING_EVENT;
            notificationManager.notify(SERVER_DATA_RECEIVED, notification);
        }
        else{
            PendingIntent pendingIntent = PendingIntent.getActivity(getApplicationContext(),
                    SERVER_DATA_RECEIVED, intent, PendingIntent.FLAG_UPDATE_CURRENT);
            Notification noti = new NotificationCompat.Builder(getApplicationContext())
                    .setSmallIcon(R.drawable.bearnotif)
                    .setLargeIcon(BitmapFactory.decodeResource(getResources(), R.drawable.ic_launcher))
                    .setAutoCancel(true)
                    .setContentIntent(pendingIntent)
                    .setContentTitle(contentTitle)
                    .setContentText(contentText)
                    .setAutoCancel(true).build();
        }
    }
    /**
     * This is deprecated, but you have to implement it if you're planning on
     * supporting devices with an API level lower than 5 (Android 2.0).
     */
    @Override
    public void onStart(Intent intent, int startId) {
        handleIntent(intent);
    }

    /**
     * This is called on 2.0+ (API level 5 or higher). Returning
     * START_NOT_STICKY tells the system to not restart the service if it is
     * killed because of poor resource (memory/cpu) conditions.
     */
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        handleIntent(intent);
        return START_NOT_STICKY;
    }

    /**
     * In onDestroy() we release our wake lock. This ensures that whenever the
     * Service stops (killed for resources, stopSelf() called, etc.), the wake
     * lock will be released.
     */
    @Override
    public void onDestroy() {
        super.onDestroy();
        mWakeLock.release();
    }
}
