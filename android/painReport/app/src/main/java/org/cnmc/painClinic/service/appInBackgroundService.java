package org.cnmc.painClinic.service;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.BitmapFactory;
import android.net.ConnectivityManager;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.SystemClock;
import android.preference.PreferenceManager;
import android.support.v4.app.NotificationCompat;
import android.util.Log;

import org.cnmc.painClinic.R;
import org.cnmc.painClinic.painReport.MainActivity;

import java.util.Timer;
import java.util.TimerTask;

public class appInBackgroundService extends Service {

    public appInBackgroundService() {
    }
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        handleIntent(intent);
        return START_NOT_STICKY;
    }

    private void handleIntent(Intent intent){
        SharedPreferences sharedPrefs = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());
        if(!sharedPrefs.getBoolean("AppInForeground",false)){
            notifBuilder("Survey still pending","Survey will be invalidated if you do not finish within");
        }

    }

    private void notifBuilder(String contentTitle,String contentText){
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

            Notification notification=builder.getNotification();
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
    @Override
    public IBinder onBind(Intent intent) {
        // TODO: Return the communication channel to the service.
        throw new UnsupportedOperationException("Not yet implemented");
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
     * In onDestroy() we release our wake lock. This ensures that whenever the
     * Service stops (killed for resources, stopSelf() called, etc.), the wake
     * lock will be released.
     */
    @Override
    public void onDestroy() {
        super.onDestroy();
    }
}
