package org.cnmc.painClinic.helper;

import android.app.Activity;
import android.app.AlarmManager;
import android.app.AlertDialog;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.cnmc.painClinic.R;
import org.cnmc.painClinic.service.appInBackgroundService;
import org.cnmc.painClinic.service.invalidateService;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Created by aniPC on 2/10/2015.
 */
public class jsHandler {
    private static int defaultAlarmIntervalInMins=60;
    Activity activity;
    String TAG = "jsHandler";
    WebView webView;
    private String pin="";
    private boolean receivedPIN=false;
    public jsHandler(Activity _contxt,WebView _webView) {
        activity = _contxt;
        webView = _webView;
    }
    /**
     * This function handles call from JS
     */
    /*@JavascriptInterface
    public void getPINfromJs(String jsString) {
        SharedPreferences sharedPrefs = PreferenceManager.getDefaultSharedPreferences(activity);
        SharedPreferences.Editor editor=sharedPrefs.edit();
        editor.putString("PIN", jsString);
        editor.commit();
    }*/

    @JavascriptInterface
    public void killApp(){
        SharedPreferences sharedPrefs = PreferenceManager.getDefaultSharedPreferences(activity);
        SharedPreferences.Editor editor=sharedPrefs.edit();
        editor.putString("surveyInProgress", null);
        editor.commit();

        //int alarmIntervalInMilli=1*20*1000;
        AlarmManager am = (AlarmManager) activity.getSystemService(Service.ALARM_SERVICE);

        //cancel any alarms related to appInBackgroundService
        Intent appInBackgroundService = new Intent(activity, org.cnmc.painClinic.service.appInBackgroundService.class);
        Intent invalidateServiceIntent=new Intent(activity, invalidateService.class);

        PendingIntent piAppInBackgroundService = PendingIntent.getService(activity,0, appInBackgroundService, 0);
        PendingIntent invalidateIntent = PendingIntent.getService(activity, 1, invalidateServiceIntent, 0);
        am.cancel(piAppInBackgroundService);
        am.cancel(invalidateIntent);

        activity.finish();
        System.exit(0);
    }

    @JavascriptInterface
    public void getSurveyInstanceId(String surveyInstanceId){
        if(!surveyInstanceId.equals("-1")){
            SharedPreferences sharedPrefs = PreferenceManager.getDefaultSharedPreferences(activity);
            SharedPreferences.Editor editor=sharedPrefs.edit();
            editor.putString("surveyInstanceId", surveyInstanceId);
            editor.commit();
        }
    }

    @JavascriptInterface
    public void checkSurveyInProgress(String surveyInProgress){
        if(!surveyInProgress.equals("Survey not in Progress")){
            SharedPreferences sharedPrefs = PreferenceManager.getDefaultSharedPreferences(activity);
            SharedPreferences.Editor editor=sharedPrefs.edit();
            editor.putString("surveyInProgress", surveyInProgress);
            editor.commit();
        }
    }

    @JavascriptInterface
    public void updateSettings(String surveyAppServerSettings,String surveyAppPin, String reminderTime, String saveStateTime){
        SharedPreferences sharedPrefs = PreferenceManager.getDefaultSharedPreferences(activity);
        SharedPreferences.Editor editor=sharedPrefs.edit();
        if(surveyAppServerSettings!=null){editor.putString("surveyAppServerSettings", surveyAppServerSettings);}
        if(surveyAppPin!=null){editor.putString("PIN", surveyAppPin);}
        if(reminderTime!=null){editor.putInt("reminderInterval", convertStringToInt(reminderTime));}
        if(saveStateTime!=null){editor.putInt("saveStateTime", convertStringToInt(saveStateTime));}
        editor.commit();
    }
    @JavascriptInterface
    public void getPendingSurvey(String submitString){
        if(isJSONValid(submitString)){
            SharedPreferences sharedPrefs = PreferenceManager.getDefaultSharedPreferences(activity);
            SharedPreferences.Editor editor=sharedPrefs.edit();
            editor.putString("pendingSurvey",submitString);
            editor.commit();
        }
    }

    @JavascriptInterface
    public void submitError(final String surveyAnswer){
        Log.i("Unsubmitted Answer:",surveyAnswer);
        new AlertDialog.Builder(activity)
                .setTitle("There seems to be a problem")
                .setMessage("Your survey was not submitted, but we will try to submit it on your behalf. Pressing ok will exit the application")
                .setNeutralButton(android.R.string.yes, new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface dialog, int which) {
                        SharedPreferences sharedPrefs = PreferenceManager.getDefaultSharedPreferences(activity);
                        SharedPreferences.Editor editor=sharedPrefs.edit();
                        editor.putString("surveyInProgress", null);
                        editor.putString("pendingSurvey",surveyAnswer);
                        editor.commit();

                        //int alarmIntervalInMilli=1*20*1000;
                        AlarmManager am = (AlarmManager) activity.getSystemService(Service.ALARM_SERVICE);

                        //cancel any alarms related to appInBackgroundService
                        Intent appInBackgroundService = new Intent(activity, org.cnmc.painClinic.service.appInBackgroundService.class);
                        Intent invalidateServiceIntent=new Intent(activity, invalidateService.class);

                        PendingIntent piAppInBackgroundService = PendingIntent.getService(activity,0, appInBackgroundService, 0);
                        PendingIntent invalidateIntent = PendingIntent.getService(activity, 1, invalidateServiceIntent, 0);
                        am.cancel(piAppInBackgroundService);
                        am.cancel(invalidateIntent);

                        activity.finish();
                        System.exit(0);
                    }
                })
                .setIcon(R.drawable.ic_launcher)
                .show();
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
    private int convertStringToInt(String input){
        int number;
        try {
            number= new Integer(input);
        } catch (NumberFormatException e) {
            number= defaultAlarmIntervalInMins;
        }
        return number;
    }
    /**
     * This function handles call from Android-Java
     */
    /*public void javaFnCall(String jsString) {

        final String webUrl = "javascript:diplayJavaMsg()";
        // Add this to avoid android.view.windowmanager$badtokenexception unable to add window
        if(!activity.isFinishing())
            // loadurl on UI main thread
            activity.runOnUiThread(new Runnable() {

                @Override
                public void run() {
                    webView.loadUrl(webUrl);
                }
            });
    }*/

}
